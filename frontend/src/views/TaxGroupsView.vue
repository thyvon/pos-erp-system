<template>
  <AppLayout
    title="Tax Groups"
    subtitle="Combine multiple tax rates into reusable compound tax rules."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Tax Groups' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Tax Groups"
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
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div class="w-full sm:w-44">
              <AppSelect
                :model-value="store.filters.is_active === '' ? null : String(store.filters.is_active)"
                :options="statusFilterOptions"
                clearable
                placeholder="Any status"
                @update:model-value="handleStatusFilter($event)"
              />
            </div>
            <button v-if="canCreateTaxGroup" type="button" class="erp-button-primary" @click="openCreateModal">
              <i class="fa-solid fa-plus"></i>
              New tax group
            </button>
          </div>
        </template>

        <template #name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div v-if="row.description" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.description }}
            </div>
          </div>
        </template>

        <template #rates="{ row }">
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="taxRate in row.tax_rates"
              :key="taxRate.id"
              class="inline-flex rounded-[10px] bg-cyan-100 px-2 py-1 text-[11px] font-medium text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300"
            >
              {{ formatTaxRate(taxRate) }}
            </span>
          </div>
        </template>

        <template #status="{ row }">
          <StatusBadge :status="row.is_active ? 'active' : 'inactive'" />
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditTaxGroup" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteTaxGroup" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create tax group' : 'Edit tax group'"
        icon="compound tax"
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
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="name">Tax group name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="description">Description</label>
              <Field id="description" name="description" class="erp-input" />
              <ErrorMessage name="description" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="mt-4">
            <label class="erp-label" for="tax_rate_ids">Tax rates</label>
            <AppSelect
              :model-value="values.tax_rate_ids || []"
              :options="taxRateOptions"
              multiple
              searchable
              placeholder="Select one or more tax rates"
              search-placeholder="Search tax rates"
              empty-text="No tax rates found."
              @update:model-value="setFieldValue('tax_rate_ids', $event || [])"
            />
            <p class="erp-helper text-slate-500 dark:text-slate-400">
              Order matters. The group will keep the selected tax rates in the order shown here.
            </p>
            <ErrorMessage name="tax_rate_ids" class="erp-helper text-rose-500 dark:text-rose-400" />
          </div>

          <div class="mt-4">
            <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                :checked="Boolean(values.is_active)"
                @change="setFieldValue('is_active', $event.target.checked)"
              />
              <span>Tax group is active</span>
            </label>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving || taxRateOptions.length === 0">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create tax group' : 'Save tax group' }}
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
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import StatusBadge from '@components/ui/StatusBadge.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { getTaxRates } from '@api/taxRates'
import { useAuthStore } from '@stores/auth'
import { useTaxGroupsStore } from '@stores/taxGroups'

const auth = useAuthStore()
const store = useTaxGroupsStore()

const canCreateTaxGroup = computed(() => auth.can('tax_groups.create'))
const canEditTaxGroup = computed(() => auth.can('tax_groups.edit'))
const canDeleteTaxGroup = computed(() => auth.can('tax_groups.delete'))
const showActionsColumn = computed(() => canEditTaxGroup.value || canDeleteTaxGroup.value)

const columns = computed(() => {
  const base = [
    { key: 'name', label: 'Tax group' },
    { key: 'rates', label: 'Rates' },
    { key: 'status', label: 'Status' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const statusFilterOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', taxGroup: null })
const deleteDialog = reactive({ show: false, taxGroup: null, itemName: '' })
const formKey = ref(0)
const taxRateOptions = ref([])

const formValues = computed(() => ({
  name: modal.taxGroup?.name ?? '',
  description: modal.taxGroup?.description ?? '',
  tax_rate_ids: modal.taxGroup?.tax_rate_ids ?? [],
  is_active: modal.taxGroup?.is_active ?? true,
}))

const schema = yup.object({
  name: yup.string().required().max(150),
  description: yup.string().nullable().max(500),
  tax_rate_ids: yup.array().of(yup.string().required()).min(1, 'Select at least one tax rate.').required(),
  is_active: yup.boolean().nullable(),
})

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const formatTaxRate = (taxRate) =>
  taxRate.type === 'percentage'
    ? `${taxRate.name} (${Number(taxRate.rate).toFixed(2)}%)`
    : `${taxRate.name} (${Number(taxRate.rate).toFixed(2)})`

const loadTaxRateOptions = async () => {
  try {
    const response = await getTaxRates({ per_page: 100, is_active: true })
    taxRateOptions.value = response.data.data.map((taxRate) => ({
      value: taxRate.id,
      label: formatTaxRate(taxRate),
      description: taxRate.type === 'percentage' ? 'Percentage' : 'Fixed amount',
      keywords: `${taxRate.name} ${taxRate.type}`,
    }))
  } catch {
    taxRateOptions.value = []
  }
}

const openCreateModal = () => {
  if (!canCreateTaxGroup.value) return
  modal.mode = 'create'
  modal.taxGroup = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (taxGroup) => {
  if (!canEditTaxGroup.value) return
  modal.mode = 'edit'
  modal.taxGroup = taxGroup
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.taxGroup = null
}

const openDeleteModal = (taxGroup) => {
  if (!canDeleteTaxGroup.value) return
  deleteDialog.show = true
  deleteDialog.taxGroup = taxGroup
  deleteDialog.itemName = taxGroup.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.taxGroup = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchTaxGroups({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchTaxGroups({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchTaxGroups({ per_page: perPage, page: 1 })
}

const handleStatusFilter = async (value) => {
  await store.fetchTaxGroups({ is_active: value ?? '', page: 1 })
}

const submitForm = async (values) => {
  try {
    const payload = {
      name: values.name,
      description: values.description || null,
      tax_rate_ids: values.tax_rate_ids || [],
      is_active: Boolean(values.is_active),
    }

    if (modal.mode === 'create') {
      await store.createTaxGroup(payload)
      showToast('success', 'Tax group created successfully.')
    } else {
      await store.updateTaxGroup(modal.taxGroup.id, payload)
      showToast('success', 'Tax group updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the tax group.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.taxGroup) return

  try {
    await store.deleteTaxGroup(deleteDialog.taxGroup.id)
    showToast('success', 'Tax group deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the tax group.')
  }
}

onMounted(async () => {
  await Promise.all([store.fetchTaxGroups(), loadTaxRateOptions()])
})
</script>
