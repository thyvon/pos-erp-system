<template>
  <AppLayout
    title="Customer Groups"
    subtitle="Manage reusable customer segments with default discount rules."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Customer Groups' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Customer Groups"
        :columns="columns"
        :rows="store.items"
        :loading="store.loading"
        :total="store.pagination.total"
        :current-page="store.pagination.current_page"
        :last-page="store.pagination.last_page"
        :per-page="store.pagination.per_page"
        :search-term="store.filters.search"
        @search="handleSearch"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      >
        <template #toolbar>
          <button v-if="canCreateCustomerGroup" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New customer group
          </button>
        </template>

        <template #name="{ row }">
          <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
        </template>

        <template #discount="{ row }">
          <div class="text-sm font-medium text-slate-700 dark:text-slate-200">
            {{ Number(row.discount).toFixed(2) }}%
          </div>
        </template>

        <template #price_group="{ row }">
          <div class="text-sm text-slate-500 dark:text-slate-400">
            {{ row.price_group?.name || 'None' }}
          </div>
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditCustomerGroup" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteCustomerGroup" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create customer group' : 'Edit customer group'"
        icon="customer segment"
        size="lg"
        @close="closeModal"
      >
        <Form
          :key="formKey"
          :validation-schema="schema"
          :initial-values="formValues"
          @submit="submitForm"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="name">Group name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="discount">Discount %</label>
              <Field id="discount" name="discount" type="number" min="0" max="100" step="0.01" class="erp-input" />
              <p class="erp-helper text-slate-500 dark:text-slate-400">
                This default discount can be applied later when a customer in this group is selected.
              </p>
              <ErrorMessage name="discount" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="mt-4">
            <label class="erp-label" for="price_group_id">Price group</label>
            <AppSelect
              :model-value="formPriceGroupValue"
              :options="priceGroupOptions"
              clearable
              placeholder="No price group"
              @update:model-value="formPriceGroupValue = $event"
            />
            <p class="erp-helper text-slate-500 dark:text-slate-400">
              Optional price group overrides the standard selling tier for customers in this group.
            </p>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create customer group' : 'Save customer group' }}
            </button>
          </div>
        </Form>
      </AppModal>

      <ConfirmDelete
        :show="deleteDialog.show"
        :item-name="deleteDialog.itemName"
        :loading="store.deleting"
        @close="closeDeleteModal"
        @confirm="confirmDelete"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ErrorMessage, Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { getPriceGroups } from '@api/priceGroups'
import AppAlert from '@components/ui/AppAlert.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useCustomerGroupsStore } from '@stores/customerGroups'

const auth = useAuthStore()
const store = useCustomerGroupsStore()

const canCreateCustomerGroup = computed(() => auth.can('customer_groups.create'))
const canEditCustomerGroup = computed(() => auth.can('customer_groups.edit'))
const canDeleteCustomerGroup = computed(() => auth.can('customer_groups.delete'))
const showActionsColumn = computed(() => canEditCustomerGroup.value || canDeleteCustomerGroup.value)

const columns = computed(() => {
  const base = [
    { key: 'name', label: 'Customer group' },
    { key: 'discount', label: 'Discount' },
    { key: 'price_group', label: 'Price group' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', customerGroup: null })
const deleteDialog = reactive({ show: false, customerGroup: null, itemName: '' })
const formKey = ref(0)
const priceGroups = ref([])
const formPriceGroupValue = ref(null)

const formValues = computed(() => ({
  name: modal.customerGroup?.name ?? '',
  discount: modal.customerGroup?.discount ?? 0,
  price_group_id: modal.customerGroup?.price_group_id ?? null,
}))

const priceGroupOptions = computed(() =>
  priceGroups.value.map((priceGroup) => ({
    value: priceGroup.id,
    label: priceGroup.name,
  }))
)

const schema = yup.object({
  name: yup.string().required().max(150),
  discount: yup.number().typeError('Discount is required.').required().min(0).max(100),
})

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const openCreateModal = () => {
  if (!canCreateCustomerGroup.value) return
  modal.mode = 'create'
  modal.customerGroup = null
  formPriceGroupValue.value = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (customerGroup) => {
  if (!canEditCustomerGroup.value) return
  modal.mode = 'edit'
  modal.customerGroup = customerGroup
  formPriceGroupValue.value = customerGroup.price_group_id ?? null
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.customerGroup = null
  formPriceGroupValue.value = null
}

const openDeleteModal = (customerGroup) => {
  if (!canDeleteCustomerGroup.value) return
  deleteDialog.show = true
  deleteDialog.customerGroup = customerGroup
  deleteDialog.itemName = customerGroup.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.customerGroup = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchCustomerGroups({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchCustomerGroups({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchCustomerGroups({ per_page: perPage, page: 1 })
}

const submitForm = async (values) => {
  try {
    const payload = {
      name: values.name,
      discount: Number(values.discount),
      price_group_id: formPriceGroupValue.value || null,
    }

    if (modal.mode === 'create') {
      await store.createCustomerGroup(payload)
      showToast('success', 'Customer group created successfully.')
    } else {
      await store.updateCustomerGroup(modal.customerGroup.id, payload)
      showToast('success', 'Customer group updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the customer group.')
  }
}

const loadPriceGroups = async () => {
  try {
    const response = await getPriceGroups({ per_page: 100 })
    priceGroups.value = response.data.data
  } catch {
    priceGroups.value = []
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.customerGroup) return

  try {
    await store.deleteCustomerGroup(deleteDialog.customerGroup.id)
    showToast('success', 'Customer group deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the customer group.')
  }
}

onMounted(async () => {
  await Promise.all([
    store.fetchCustomerGroups(),
    loadPriceGroups(),
  ])
})
</script>
