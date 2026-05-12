<template>
  <AppLayout
    title="Tax Rates"
    subtitle="Manage business-wide tax rates for sales, purchases, and future tax groups."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Tax Rates' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <DataTable
        title="Tax Rates"
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
                :model-value="store.filters.type || null"
                :options="typeFilterOptions"
                clearable
                placeholder="All types"
                @update:model-value="handleTypeFilter($event)"
              />
            </div>
            <div class="w-full sm:w-44">
              <AppSelect
                :model-value="store.filters.is_active === '' ? null : String(store.filters.is_active)"
                :options="statusFilterOptions"
                clearable
                placeholder="Any status"
                @update:model-value="handleStatusFilter($event)"
              />
            </div>
            <button v-if="canCreateTaxRate" type="button" class="erp-button-primary" @click="openCreateModal">
              <i class="fa-solid fa-plus"></i>
              New tax rate
            </button>
          </div>
        </template>

        <template #name="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.type === 'percentage' ? 'Percentage' : 'Fixed amount' }}
            </div>
          </div>
        </template>

        <template #rate="{ row }">
          <div class="text-sm font-medium text-slate-700 dark:text-slate-200">
            {{ formatRate(row) }}
          </div>
        </template>

        <template #status="{ row }">
          <div class="flex flex-wrap items-center gap-2">
            <StatusBadge :status="row.is_active ? 'active' : 'inactive'" />
              <span v-if="row.is_default" class="erp-badge erp-badge-info px-3 uppercase tracking-[0.16em]">
                Default
              </span>
          </div>
        </template>

        <template #actions="{ row }">
          <div v-if="showActionsColumn" class="flex items-center gap-2">
            <button v-if="canEditTaxRate" type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button v-if="canDeleteTaxRate" type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create tax rate' : 'Edit tax rate'"
        icon="tax rule"
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
              <label class="erp-label" for="name">Tax rate name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="type">Type</label>
              <AppSelect
                :model-value="values.type || null"
                :options="typeSelectOptions"
                placeholder="Select type"
                @update:model-value="setFieldValue('type', $event || '')"
              />
              <ErrorMessage name="type" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="mt-4">
            <label class="erp-label" for="rate">Rate</label>
            <Field id="rate" name="rate" type="number" min="0" step="0.01" class="erp-input" />
            <p class="erp-helper text-slate-500 dark:text-slate-400">
              {{ values.type === 'percentage' ? 'Percentage values must be between 0 and 100.' : 'Fixed amount uses your business currency.' }}
            </p>
            <ErrorMessage name="rate" class="erp-helper text-rose-500 dark:text-rose-400" />
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                :checked="Boolean(values.is_default)"
                @change="setFieldValue('is_default', $event.target.checked)"
              />
              <span>Default tax rate</span>
            </label>
            <label class="flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                :checked="Boolean(values.is_active)"
                @change="setFieldValue('is_active', $event.target.checked)"
              />
              <span>Tax rate is active</span>
            </label>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create tax rate' : 'Save tax rate' }}
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
import { useAuthStore } from '@stores/auth'
import { useTaxRatesStore } from '@stores/taxRates'

const auth = useAuthStore()
const store = useTaxRatesStore()

const canCreateTaxRate = computed(() => auth.can('tax_rates.create'))
const canEditTaxRate = computed(() => auth.can('tax_rates.edit'))
const canDeleteTaxRate = computed(() => auth.can('tax_rates.delete'))
const showActionsColumn = computed(() => canEditTaxRate.value || canDeleteTaxRate.value)

const columns = computed(() => {
  const base = [
    { key: 'name', label: 'Tax rate' },
    { key: 'rate', label: 'Rate' },
    { key: 'status', label: 'Status' },
  ]

  if (showActionsColumn.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const typeSelectOptions = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed amount' },
]

const typeFilterOptions = typeSelectOptions
const statusFilterOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', taxRate: null })
const deleteDialog = reactive({ show: false, taxRate: null, itemName: '' })
const formKey = ref(0)

const formValues = computed(() => ({
  name: modal.taxRate?.name ?? '',
  rate: modal.taxRate?.rate ?? '',
  type: modal.taxRate?.type ?? 'percentage',
  is_default: modal.taxRate?.is_default ?? false,
  is_active: modal.taxRate?.is_active ?? true,
}))

const schema = yup.object({
  name: yup.string().required().max(150),
  rate: yup
    .number()
    .typeError('Rate is required.')
    .required()
    .min(0)
    .when('type', {
      is: 'percentage',
      then: (rule) => rule.max(100, 'Percentage tax rate cannot exceed 100.'),
    }),
  type: yup.string().required(),
  is_default: yup.boolean().nullable(),
  is_active: yup.boolean().nullable(),
})

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const formatRate = (taxRate) =>
  taxRate.type === 'percentage'
    ? `${Number(taxRate.rate).toFixed(2)}%`
    : Number(taxRate.rate).toFixed(2)

const openCreateModal = () => {
  if (!canCreateTaxRate.value) return
  modal.mode = 'create'
  modal.taxRate = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (taxRate) => {
  if (!canEditTaxRate.value) return
  modal.mode = 'edit'
  modal.taxRate = taxRate
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.taxRate = null
}

const openDeleteModal = (taxRate) => {
  if (!canDeleteTaxRate.value) return
  deleteDialog.show = true
  deleteDialog.taxRate = taxRate
  deleteDialog.itemName = taxRate.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.taxRate = null
  deleteDialog.itemName = ''
}

const handleSearch = async (value) => {
  await store.fetchTaxRates({ search: value, page: 1 })
}

const handlePageChange = async (page) => {
  await store.fetchTaxRates({ page })
}

const handlePerPageChange = async (perPage) => {
  await store.fetchTaxRates({ per_page: perPage, page: 1 })
}

const handleTypeFilter = async (value) => {
  await store.fetchTaxRates({ type: value || '', page: 1 })
}

const handleStatusFilter = async (value) => {
  await store.fetchTaxRates({ is_active: value ?? '', page: 1 })
}

const submitForm = async (values) => {
  try {
    const payload = {
      name: values.name,
      rate: Number(values.rate),
      type: values.type,
      is_default: Boolean(values.is_default),
      is_active: Boolean(values.is_active),
    }

    if (modal.mode === 'create') {
      await store.createTaxRate(payload)
      showToast('success', 'Tax rate created successfully.')
    } else {
      await store.updateTaxRate(modal.taxRate.id, payload)
      showToast('success', 'Tax rate updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the tax rate.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.taxRate) return

  try {
    await store.deleteTaxRate(deleteDialog.taxRate.id)
    showToast('success', 'Tax rate deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the tax rate.')
  }
}

onMounted(async () => {
  await store.fetchTaxRates()
})
</script>
