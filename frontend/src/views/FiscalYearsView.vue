<template>
  <AppLayout
    title="Fiscal Years"
    subtitle="Manage posting periods and lock the accounting calendar without branch scope."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Accounting' },
      { label: 'Fiscal Years' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-calendar-days text-cyan-600 dark:text-cyan-400"></i>
            Total Years
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.total_years }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Configured accounting periods for this business.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-door-open text-cyan-600 dark:text-cyan-400"></i>
            Active
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.active_years }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Years open for normal journal posting.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-box-archive text-cyan-600 dark:text-cyan-400"></i>
            Closed
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.closed_years }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Historical years already locked by finance.</p>
        </article>
      </section>

      <FilterPanel
        v-model:expanded="filtersExpanded"
        title="Filters"
        description="Focus on active or closed fiscal years."
        :active-count="activeFilterCount"
        :show-clear="activeFilterCount > 0"
        @clear="resetFilters"
      >
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label class="erp-label">Status</label>
            <AppSelect
              :model-value="store.filters.status || null"
              :options="statusOptions"
              clearable
              placeholder="All fiscal years"
              @update:model-value="handleStatusFilter($event)"
            />
          </div>
        </div>
      </FilterPanel>

      <DataTable
        title="Fiscal Years"
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
          <button v-if="canManageYears" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New fiscal year
          </button>
        </template>

        <template #year="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.journal_count || 0 }} journal{{ row.journal_count === 1 ? '' : 's' }}</div>
          </div>
        </template>

        <template #range="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ formatHumanDate(row.start_date) }} to {{ formatHumanDate(row.end_date) }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">Created {{ formatHumanDateTime(row.created_at) }}</div>
          </div>
        </template>

        <template #status="{ row }">
          <span class="erp-badge capitalize" :class="getAccountingStatusClass(row.status)">
            {{ startCase(row.status) }}
          </span>
        </template>

        <template #closed="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">{{ formatHumanDateTime(row.closed_at, 'Not closed') }}</div>
        </template>

        <template #actions="{ row }">
          <div v-if="canManageYears" class="flex items-center gap-2">
            <button type="button" class="erp-button-icon" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="erp-button-icon" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create fiscal year' : 'Edit fiscal year'"
        icon="fiscal calendar"
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
              <label class="erp-label" for="name">Fiscal year name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label">Status</label>
              <AppSelect
                :model-value="values.status || null"
                :options="statusOptions"
                placeholder="Select status"
                @update:model-value="setFieldValue('status', $event || '')"
              />
              <ErrorMessage name="status" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label">Start date</label>
              <AppDatePicker :model-value="values.start_date || ''" @update:model-value="setFieldValue('start_date', $event || '')" />
              <ErrorMessage name="start_date" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label">End date</label>
              <AppDatePicker :model-value="values.end_date || ''" @update:model-value="setFieldValue('end_date', $event || '')" />
              <ErrorMessage name="end_date" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create fiscal year' : 'Save fiscal year' }}
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
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import FilterPanel from '@components/ui/FilterPanel.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useFiscalYearsStore } from '@stores/accounting'
import { useAuthStore } from '@stores/auth'
import { getAccountingStatusClass, startCase } from '@/utils/accounting'
import { formatHumanDate, formatHumanDateTime } from '@/utils/date'

const auth = useAuthStore()
const store = useFiscalYearsStore()
const filtersExpanded = ref(false)
const formKey = ref(0)

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', item: null })
const deleteDialog = reactive({ show: false, item: null, itemName: '' })

const canManageYears = computed(() => auth.can('accounting.index'))
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
]

const columns = computed(() => {
  const base = [
    { key: 'year', label: 'Fiscal Year' },
    { key: 'range', label: 'Date Range' },
    { key: 'status', label: 'Status' },
    { key: 'closed', label: 'Closed At' },
  ]

  if (canManageYears.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const formValues = computed(() => ({
  name: modal.item?.name ?? '',
  start_date: modal.item?.start_date ?? '',
  end_date: modal.item?.end_date ?? '',
  status: modal.item?.status ?? 'active',
}))

const schema = yup.object({
  name: yup.string().required().max(100),
  start_date: yup.string().required(),
  end_date: yup.string().required(),
  status: yup.string().required(),
})

const activeFilterCount = computed(() => (store.filters.status ? 1 : 0))

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const openCreateModal = () => {
  if (!canManageYears.value) return
  modal.mode = 'create'
  modal.item = null
  modal.show = true
  formKey.value += 1
}

const openEditModal = (item) => {
  if (!canManageYears.value) return
  modal.mode = 'edit'
  modal.item = item
  modal.show = true
  formKey.value += 1
}

const closeModal = () => {
  modal.show = false
  modal.item = null
}

const openDeleteModal = (item) => {
  if (!canManageYears.value) return
  deleteDialog.show = true
  deleteDialog.item = item
  deleteDialog.itemName = item.name
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.item = null
  deleteDialog.itemName = ''
}

const handleSearch = (value) => store.fetchItems({ search: value, page: 1 })
const handlePageChange = (page) => store.fetchItems({ page })
const handlePerPageChange = (perPage) => store.fetchItems({ per_page: perPage, page: 1 })
const handleStatusFilter = (value) => store.fetchItems({ status: value || '', page: 1 })

const resetFilters = () => {
  store.fetchItems({
    status: '',
    page: 1,
  })
}

const submitForm = async (values) => {
  try {
    const payload = {
      name: values.name,
      start_date: values.start_date,
      end_date: values.end_date,
      status: values.status,
    }

    if (modal.mode === 'create') {
      await store.createItem(payload)
      showToast('success', 'Fiscal year created successfully.')
    } else {
      await store.updateItem(modal.item.id, payload)
      showToast('success', 'Fiscal year updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the fiscal year.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.item) return

  try {
    await store.deleteItem(deleteDialog.item.id)
    showToast('success', 'Fiscal year deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the fiscal year.')
  }
}

onMounted(() => {
  store.fetchItems()
})
</script>
