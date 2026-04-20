<template>
  <AppLayout
    title="Chart of Accounts"
    subtitle="Manage the business-wide ledger structure used by journals, payment accounts, and reports."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Accounting' },
      { label: 'Chart of Accounts' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-list-tree text-cyan-600 dark:text-cyan-400"></i>
            Total Accounts
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.total_accounts }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Business-wide chart structure for posting and reporting.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-pen-ruler text-cyan-600 dark:text-cyan-400"></i>
            Posting Accounts
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.postable_accounts }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Leaf accounts that can receive journal lines directly.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-lock text-cyan-600 dark:text-cyan-400"></i>
            System Locked
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.system_accounts }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Seeded accounts protected from edit and delete operations.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-circle-check text-cyan-600 dark:text-cyan-400"></i>
            Active
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.active_accounts }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Accounts currently available for accounting operations.</p>
        </article>
      </section>

      <FilterPanel
        v-model:expanded="filtersExpanded"
        title="Filters"
        description="Narrow the chart by account type or active state."
        :active-count="activeFilterCount"
        :show-clear="activeFilterCount > 0"
        @clear="resetFilters"
      >
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label class="erp-label">Account type</label>
            <AppSelect
              :model-value="store.filters.type || null"
              :options="typeOptions"
              clearable
              placeholder="All account types"
              @update:model-value="handleTypeFilter($event)"
            />
          </div>
          <div>
            <label class="erp-label">Status</label>
            <AppSelect
              :model-value="store.filters.status || null"
              :options="statusOptions"
              clearable
              placeholder="All statuses"
              @update:model-value="handleStatusFilter($event)"
            />
          </div>
        </div>
      </FilterPanel>

      <DataTable
        title="Chart of Accounts"
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
          <button v-if="canManageAccounts" type="button" class="erp-button-primary" @click="openCreateModal">
            <i class="fa-solid fa-plus"></i>
            New account
          </button>
        </template>

        <template #account="{ row }">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <div class="font-semibold text-slate-950 dark:text-white">{{ row.code }} - {{ row.name }}</div>
              <span v-if="row.is_system" class="erp-badge erp-badge-info">System</span>
            </div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.parent ? `Parent: ${row.parent.code} - ${row.parent.name}` : 'Top-level account' }}
            </div>
          </div>
        </template>

        <template #classification="{ row }">
          <div class="flex flex-wrap items-center gap-2">
            <span class="erp-badge capitalize" :class="getAccountingTypeClass(row.type)">
              {{ startCase(row.type) }}
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {{ row.detail_type ? startCase(row.detail_type) : 'General' }} - {{ startCase(row.normal_balance) }}
            </span>
          </div>
        </template>

        <template #posting="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.is_postable ? 'Posting allowed' : 'Header only' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.children_count }} child account{{ row.children_count === 1 ? '' : 's' }} - {{ row.journal_entries_count }} journal line{{ row.journal_entries_count === 1 ? '' : 's' }}
            </div>
          </div>
        </template>

        <template #status="{ row }">
          <span class="erp-badge capitalize" :class="getAccountingStatusClass(row.status)">
            {{ startCase(row.status) }}
          </span>
        </template>

        <template #updated="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">{{ formatHumanDateTime(row.updated_at) }}</div>
        </template>

        <template #actions="{ row }">
          <div v-if="canManageAccounts" class="flex items-center gap-2">
            <button type="button" class="erp-button-icon" :disabled="row.is_system" @click="openEditModal(row)">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="erp-button-icon" :disabled="row.is_system" @click="openDeleteModal(row)">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </template>
      </DataTable>

      <AppModal
        :show="modal.show"
        :title="modal.mode === 'create' ? 'Create chart account' : 'Edit chart account'"
        icon="accounting setup"
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
              <label class="erp-label" for="code">Account code</label>
              <Field id="code" name="code" class="erp-input" :disabled="modal.item?.is_system" />
              <ErrorMessage name="code" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="name">Account name</label>
              <Field id="name" name="name" class="erp-input" :disabled="modal.item?.is_system" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label">Account type</label>
              <AppSelect
                :model-value="values.type || null"
                :options="typeOptions"
                placeholder="Select type"
                :disabled="modal.item?.is_system"
                @update:model-value="setFieldValue('type', $event || '')"
              />
              <ErrorMessage name="type" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label">Normal balance</label>
              <AppSelect
                :model-value="values.normal_balance || null"
                :options="normalBalanceOptions"
                placeholder="Select normal balance"
                :disabled="modal.item?.is_system"
                @update:model-value="setFieldValue('normal_balance', $event || '')"
              />
              <ErrorMessage name="normal_balance" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="detail_type">Detail type</label>
              <Field id="detail_type" name="sub_type" class="erp-input" :disabled="modal.item?.is_system" />
              <ErrorMessage name="sub_type" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label">Parent account</label>
              <AppSelect
                :model-value="values.parent_id || null"
                :options="parentOptions"
                clearable
                searchable
                placeholder="No parent"
                search-placeholder="Search accounts"
                empty-text="No parent accounts found."
                :disabled="modal.item?.is_system"
                @update:model-value="setFieldValue('parent_id', $event || '')"
              />
              <ErrorMessage name="parent_id" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div>
            <label class="erp-label" for="description">Description</label>
            <Field id="description" name="description" as="textarea" rows="3" class="erp-input min-h-[6rem]" :disabled="modal.item?.is_system" />
            <ErrorMessage name="description" class="erp-helper text-rose-500 dark:text-rose-400" />
          </div>

          <label class="mt-4 flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              :checked="Boolean(values.is_active)"
              :disabled="modal.item?.is_system"
              @change="setFieldValue('is_active', $event.target.checked)"
            />
            <span>Account is active</span>
          </label>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving || modal.item?.is_system">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create account' : 'Save account' }}
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
import * as accountingApi from '@api/accounting'
import AppAlert from '@components/ui/AppAlert.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import FilterPanel from '@components/ui/FilterPanel.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useChartOfAccountsStore } from '@stores/accounting'
import { useAuthStore } from '@stores/auth'
import { getAccountingStatusClass, getAccountingTypeClass, startCase } from '@/utils/accounting'
import { formatHumanDateTime } from '@/utils/date'

const auth = useAuthStore()
const store = useChartOfAccountsStore()
const filtersExpanded = ref(false)
const formKey = ref(0)
const lookupAccounts = ref([])

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', item: null })
const deleteDialog = reactive({ show: false, item: null, itemName: '' })

const canManageAccounts = computed(() => auth.can('accounting.coa'))
const typeOptions = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
]
const normalBalanceOptions = [
  { value: 'debit', label: 'Debit' },
  { value: 'credit', label: 'Credit' },
]
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const parentOptions = computed(() =>
  lookupAccounts.value
    .filter((account) => account.id !== modal.item?.id)
    .map((account) => ({
      value: account.id,
      label: `${account.code} - ${account.name}`,
    }))
)

const columns = computed(() => {
  const base = [
    { key: 'account', label: 'Account' },
    { key: 'classification', label: 'Classification' },
    { key: 'posting', label: 'Posting Rules' },
    { key: 'status', label: 'Status' },
    { key: 'updated', label: 'Updated' },
  ]

  if (canManageAccounts.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const formValues = computed(() => ({
  code: modal.item?.code ?? '',
  name: modal.item?.name ?? '',
  type: modal.item?.type ?? '',
  sub_type: modal.item?.detail_type ?? '',
  parent_id: modal.item?.parent_id ?? '',
  normal_balance: modal.item?.normal_balance ?? '',
  description: modal.item?.description ?? '',
  is_active: modal.item?.status ? modal.item.status === 'active' : true,
}))

const schema = yup.object({
  code: yup.string().required().max(20),
  name: yup.string().required().max(255),
  type: yup.string().required(),
  sub_type: yup.string().nullable().max(50),
  parent_id: yup.string().nullable(),
  normal_balance: yup.string().required(),
  description: yup.string().nullable(),
  is_active: yup.boolean().nullable(),
})

const activeFilterCount = computed(() =>
  [store.filters.type, store.filters.status].filter((value) => value !== '' && value !== null).length
)

const showToast = (type, message) => {
  alert.type = type
  alert.title = type === 'danger' ? 'Error' : 'Success'
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const loadLookupAccounts = async () => {
  try {
    const response = await accountingApi.getChartOfAccounts({ per_page: 250 })
    lookupAccounts.value = response.data.data
  } catch {
    lookupAccounts.value = []
  }
}

const warmLookupAccounts = () => {
  loadLookupAccounts()
}

const openCreateModal = () => {
  if (!canManageAccounts.value) return
  modal.mode = 'create'
  modal.item = null
  modal.show = true
  formKey.value += 1
  warmLookupAccounts()
}

const openEditModal = (item) => {
  if (!canManageAccounts.value || item.is_system) return
  modal.mode = 'edit'
  modal.item = item
  modal.show = true
  formKey.value += 1
  warmLookupAccounts()
}

const closeModal = () => {
  modal.show = false
  modal.item = null
}

const openDeleteModal = (item) => {
  if (!canManageAccounts.value || item.is_system) return
  deleteDialog.show = true
  deleteDialog.item = item
  deleteDialog.itemName = `${item.code} · ${item.name}`
}

const closeDeleteModal = () => {
  deleteDialog.show = false
  deleteDialog.item = null
  deleteDialog.itemName = ''
}

const handleSearch = (value) => store.fetchItems({ search: value, page: 1 })
const handlePageChange = (page) => store.fetchItems({ page })
const handlePerPageChange = (perPage) => store.fetchItems({ per_page: perPage, page: 1 })
const handleTypeFilter = (value) => store.fetchItems({ type: value || '', page: 1 })
const handleStatusFilter = (value) => store.fetchItems({ status: value || '', page: 1 })

const resetFilters = () => {
  store.fetchItems({
    type: '',
    status: '',
    page: 1,
  })
}

const submitForm = async (values) => {
  try {
    const payload = {
      code: values.code,
      name: values.name,
      type: values.type,
      sub_type: values.sub_type || null,
      parent_id: values.parent_id || null,
      normal_balance: values.normal_balance,
      description: values.description || null,
      is_active: Boolean(values.is_active),
    }

    if (modal.mode === 'create') {
      await store.createItem(payload)
      showToast('success', 'Chart account created successfully.')
    } else {
      await store.updateItem(modal.item.id, payload)
      showToast('success', 'Chart account updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the chart account.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.item) return

  try {
    await store.deleteItem(deleteDialog.item.id)
    showToast('success', 'Chart account deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the chart account.')
  }
}

onMounted(() => {
  store.fetchItems()
  warmLookupAccounts()
})
</script>




