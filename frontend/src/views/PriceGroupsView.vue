<template>
  <AppLayout
    title="Price Groups"
    subtitle="Manage reusable price tiers and choose one default selling group for the business."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Catalog' },
      { label: 'Price Groups' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Price Groups"
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
          <button v-if="canCreatePriceGroup" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New price group
          </button>
        </template>

        <template #name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.description || 'No description' }}
            </div>
          </div>
        </template>

        <template #default="{ row }">
          <span
            class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="row.is_default ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
          >
            {{ row.is_default ? 'Default' : 'Standard' }}
          </span>
        </template>

        <template #usage="{ row }">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            {{ row.customer_groups_count }} customer group{{ row.customer_groups_count === 1 ? '' : 's' }}
          </div>
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditPriceGroup" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeletePriceGroup" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create price group' : 'Edit price group'"
        icon="price tier"
        size="lg"
        @close="closeModal"
      >
        <Form
          v-slot="{ values, setFieldValue }"
          :key="formKey"
          :validation-schema="schema"
          :initial-values="formValues"
          @submit="submitForm"
        >
          <div class="grid gap-4">
            <div>
              <label class="erp-label" for="name">Price group name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>

            <div>
              <label class="erp-label" for="description">Description</label>
              <Field id="description" name="description" as="textarea" rows="3" class="erp-input min-h-[6rem]" />
              <ErrorMessage name="description" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <label
            class="mt-5 flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              :checked="Boolean(values.is_default)"
              @change="setFieldValue('is_default', $event.target.checked)"
            />
            <span>Set as the default price group for this business</span>
          </label>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create price group' : 'Save price group' }}
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
import AppAlert from '@components/ui/AppAlert.vue'
import AppModal from '@components/ui/AppModal.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { usePriceGroupsStore } from '@stores/priceGroups'

const auth = useAuthStore()
const store = usePriceGroupsStore()

const canCreatePriceGroup = computed(() => auth.can('price_groups.create'))
const canEditPriceGroup = computed(() => auth.can('price_groups.edit'))
const canDeletePriceGroup = computed(() => auth.can('price_groups.delete'))
const showActionsColumn = computed(() => canEditPriceGroup.value || canDeletePriceGroup.value)

const columns = computed(() => {
  const base = [
    { key: 'name', label: 'Price group' },
    { key: 'default', label: 'Default' },
    { key: 'usage', label: 'Usage' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', priceGroup: null })
const deleteDialog = reactive({ show: false, priceGroup: null, itemName: '' })
const formKey = ref(0)

const formValues = computed(() => ({
  name: modal.priceGroup?.name ?? '',
  description: modal.priceGroup?.description ?? '',
  is_default: modal.priceGroup?.is_default ?? false,
}))

const schema = yup.object({
  name: yup.string().required().max(150),
  description: yup.string().nullable(),
  is_default: yup.boolean().required(),
})

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const openCreateModal = () => {
  if (!canCreatePriceGroup.value) return
  modal.mode = 'create'
  modal.priceGroup = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (priceGroup) => {
  if (!canEditPriceGroup.value) return
  modal.mode = 'edit'
  modal.priceGroup = priceGroup
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.priceGroup = null
}

const openDeleteModal = (priceGroup) => {
  if (!canDeletePriceGroup.value) return
  deleteDialog.show = true
  deleteDialog.priceGroup = priceGroup
  deleteDialog.itemName = priceGroup.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.priceGroup = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchPriceGroups({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchPriceGroups({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchPriceGroups({ per_page: perPage, page: 1 })
}

const submitForm = async (values) => {
  try {
    const payload = {
      name: values.name,
      description: values.description || null,
      is_default: Boolean(values.is_default),
    }

    if (modal.mode === 'create') {
      await store.createPriceGroup(payload)
      showToast('success', 'Price group created successfully.')
    } else {
      await store.updatePriceGroup(modal.priceGroup.id, payload)
      showToast('success', 'Price group updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the price group.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.priceGroup) return

  try {
    await store.deletePriceGroup(deleteDialog.priceGroup.id)
    showToast('success', 'Price group deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the price group.')
  }
}

onMounted(async () => {
  await store.fetchPriceGroups()
})
</script>
