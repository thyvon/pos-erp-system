<template>
  <AppLayout
    title="Payment Accounts"
    subtitle="Manage cash and bank accounts linked to the ledger and internal transfers."
    :breadcrumbs="[
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Accounting' },
      { label: 'Payment Accounts' },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-wallet text-cyan-600 dark:text-cyan-400"></i>
            Total Accounts
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.total_accounts }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Configured payment rails available to the business.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-building-columns text-cyan-600 dark:text-cyan-400"></i>
            Bank Accounts
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.bank_accounts }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Accounts used for bank settlements and transfers.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-circle-check text-cyan-600 dark:text-cyan-400"></i>
            Active
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.active_accounts }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Accounts currently available for payments and transfers.</p>
        </article>

        <article class="erp-ios-stat">
          <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <i class="fa-solid fa-link text-cyan-600 dark:text-cyan-400"></i>
            Linked COA
          </div>
          <div class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{{ store.summary.linked_accounts }}</div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Payment accounts already mapped to postable ledger accounts.</p>
        </article>
      </section>

      <FilterPanel
        v-model:expanded="filtersExpanded"
        title="Filters"
        description="Filter payment accounts by channel type or active state."
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
        title="Payment Accounts"
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
          <div v-if="canManageAccounts" class="flex items-center gap-2">
            <button type="button" class="erp-button-secondary" @click="openTransferModal">
              <i class="fa-solid fa-right-left"></i>
              Transfer
            </button>
            <button type="button" class="erp-button-primary" @click="openCreateModal">
              <i class="fa-solid fa-plus"></i>
              New account
            </button>
          </div>
        </template>

        <template #account="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.name }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.account_number || 'No account number' }}
              <span v-if="row.bank_name"> - {{ row.bank_name }}</span>
            </div>
          </div>
        </template>

        <template #type="{ row }">
          <span class="erp-badge capitalize" :class="getAccountingTypeClass(row.type)">
            {{ startCase(row.type) }}
          </span>
        </template>

        <template #linked="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.chart_of_account ? `${row.chart_of_account.code} - ${row.chart_of_account.name}` : 'Not linked' }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.transactions_count || 0 }} transaction{{ row.transactions_count === 1 ? '' : 's' }}</div>
          </div>
        </template>

        <template #balance="{ row }">
          <div class="text-sm font-semibold text-slate-900 dark:text-white">{{ formatAccountingMoney(row.current_balance) }}</div>
        </template>

        <template #activity="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>Opening {{ formatAccountingMoney(row.opening_balance) }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">Updated {{ formatHumanDateTime(row.updated_at) }}</div>
          </div>
        </template>

        <template #status="{ row }">
          <span class="erp-badge capitalize" :class="getAccountingStatusClass(row.status)">
            {{ startCase(row.status) }}
          </span>
        </template>

        <template #actions="{ row }">
          <div v-if="canManageAccounts" class="flex items-center gap-2">
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
        :title="modal.mode === 'create' ? 'Create payment account' : 'Edit payment account'"
        icon="payment account"
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
              <label class="erp-label" for="name">Account name</label>
              <Field id="name" name="name" class="erp-input" />
              <ErrorMessage name="name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label">Account type</label>
              <AppSelect
                :model-value="values.account_type || null"
                :options="typeOptions"
                placeholder="Select type"
                @update:model-value="setFieldValue('account_type', $event || '')"
              />
              <ErrorMessage name="account_type" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="account_number">Account number</label>
              <Field id="account_number" name="account_number" class="erp-input" />
              <ErrorMessage name="account_number" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label" for="bank_name">Bank name</label>
              <Field id="bank_name" name="bank_name" class="erp-input" />
              <ErrorMessage name="bank_name" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="opening_balance">Opening balance</label>
              <Field id="opening_balance" name="opening_balance" type="number" min="0" step="0.01" class="erp-input" />
              <ErrorMessage name="opening_balance" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label">Linked chart account</label>
              <AppSelect
                :model-value="values.coa_account_id || null"
                :options="coaOptions"
                clearable
                searchable
                placeholder="No linked account"
                search-placeholder="Search accounts"
                empty-text="No postable accounts found."
                @update:model-value="setFieldValue('coa_account_id', $event || '')"
              />
              <ErrorMessage name="coa_account_id" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div>
            <label class="erp-label" for="note">Note</label>
            <Field id="note" name="note" as="textarea" rows="3" class="erp-input min-h-[6rem]" />
            <ErrorMessage name="note" class="erp-helper text-rose-500 dark:text-rose-400" />
          </div>

          <label class="mt-4 flex items-center gap-3 rounded-[5px] border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              :checked="Boolean(values.is_active)"
              @change="setFieldValue('is_active', $event.target.checked)"
            />
            <span>Payment account is active</span>
          </label>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              {{ modal.mode === 'create' ? 'Create account' : 'Save account' }}
            </button>
          </div>
        </Form>
      </AppModal>

      <AppModal :show="transferModal.show" title="Transfer between payment accounts" icon="internal transfer" size="lg" @close="closeTransferModal">
        <Form
          v-slot="{ values, setFieldValue }"
          :key="transferFormKey"
          :validation-schema="transferSchema"
          :initial-values="transferValues"
          @submit="submitTransfer"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label">From account</label>
              <AppSelect
                :model-value="values.from_payment_account_id || null"
                :options="transferAccountOptions"
                searchable
                placeholder="Select source account"
                search-placeholder="Search payment accounts"
                empty-text="No active accounts found."
                @update:model-value="setFieldValue('from_payment_account_id', $event || '')"
              />
              <ErrorMessage name="from_payment_account_id" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label">To account</label>
              <AppSelect
                :model-value="values.to_payment_account_id || null"
                :options="transferAccountOptions"
                searchable
                placeholder="Select destination account"
                search-placeholder="Search payment accounts"
                empty-text="No active accounts found."
                @update:model-value="setFieldValue('to_payment_account_id', $event || '')"
              />
              <ErrorMessage name="to_payment_account_id" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label" for="amount">Amount</label>
              <Field id="amount" name="amount" type="number" min="0.01" step="0.01" class="erp-input" />
              <ErrorMessage name="amount" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <label class="erp-label">Transfer date</label>
              <AppDatePicker
                :model-value="values.transaction_date || ''"
                @update:model-value="setFieldValue('transaction_date', $event || '')"
              />
              <ErrorMessage name="transaction_date" class="erp-helper text-rose-500 dark:text-rose-400" />
            </div>
          </div>

          <div>
            <label class="erp-label" for="transfer_note">Note</label>
            <Field id="transfer_note" name="note" as="textarea" rows="3" class="erp-input min-h-[6rem]" />
            <ErrorMessage name="note" class="erp-helper text-rose-500 dark:text-rose-400" />
          </div>

          <div class="erp-form-actions mt-6">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeTransferModal">Cancel</button>
            <button type="submit" class="erp-button-primary" :disabled="store.saving">
              <span
                v-if="store.saving"
                class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/25 dark:border-t-slate-950"
              ></span>
              Post transfer
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
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import ConfirmDelete from '@components/ui/ConfirmDelete.vue'
import DataTable from '@components/ui/DataTable.vue'
import FilterPanel from '@components/ui/FilterPanel.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { usePaymentAccountsStore } from '@stores/accounting'
import { useAuthStore } from '@stores/auth'
import { formatAccountingMoney, getAccountingStatusClass, getAccountingTypeClass, startCase } from '@/utils/accounting'
import { formatHumanDateTime } from '@/utils/date'

const auth = useAuthStore()
const store = usePaymentAccountsStore()
const filtersExpanded = ref(false)
const formKey = ref(0)
const transferFormKey = ref(0)
const coaLookup = ref([])
const paymentAccountLookup = ref([])

const alert = reactive({ show: false, type: 'success', title: 'Success', message: '' })
const modal = reactive({ show: false, mode: 'create', item: null })
const transferModal = reactive({ show: false })
const deleteDialog = reactive({ show: false, item: null, itemName: '' })

const canManageAccounts = computed(() => auth.can('accounting.index'))
const typeOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' },
]
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const coaOptions = computed(() =>
  coaLookup.value
    .filter((account) => account.status === 'active' && account.is_postable)
    .map((account) => ({
      value: account.id,
      label: `${account.code} - ${account.name}`,
    }))
)

const transferAccountOptions = computed(() =>
  paymentAccountLookup.value
    .filter((account) => account.status === 'active')
    .map((account) => ({
      value: account.id,
      label: `${account.name}${account.account_number ? ` - ${account.account_number}` : ''}`,
    }))
)

const columns = computed(() => {
  const base = [
    { key: 'account', label: 'Account' },
    { key: 'type', label: 'Type' },
    { key: 'linked', label: 'Linked COA' },
    { key: 'balance', label: 'Current Balance' },
    { key: 'activity', label: 'Activity' },
    { key: 'status', label: 'Status' },
  ]

  if (canManageAccounts.value) {
    base.push({ key: 'actions', label: 'Actions' })
  }

  return base
})

const formValues = computed(() => ({
  name: modal.item?.name ?? '',
  account_type: modal.item?.type ?? '',
  account_number: modal.item?.account_number ?? '',
  bank_name: modal.item?.bank_name ?? '',
  opening_balance: modal.item?.opening_balance ?? 0,
  coa_account_id: modal.item?.chart_of_account?.id ?? '',
  note: modal.item?.note ?? '',
  is_active: modal.item?.status ? modal.item.status === 'active' : true,
}))

const transferValues = computed(() => ({
  from_payment_account_id: '',
  to_payment_account_id: '',
  amount: '',
  transaction_date: new Date().toISOString().slice(0, 10),
  note: '',
}))

const schema = yup.object({
  name: yup.string().required().max(100),
  account_type: yup.string().required(),
  account_number: yup.string().nullable().max(50),
  bank_name: yup.string().nullable().max(100),
  opening_balance: yup.number().min(0).required(),
  coa_account_id: yup.string().nullable(),
  note: yup.string().nullable(),
  is_active: yup.boolean().nullable(),
})

const transferSchema = yup.object({
  from_payment_account_id: yup.string().required(),
  to_payment_account_id: yup.string().required().notOneOf([yup.ref('from_payment_account_id')], 'Source and destination must be different.'),
  amount: yup.number().min(0.01).required(),
  transaction_date: yup.string().required(),
  note: yup.string().nullable(),
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

const loadCoaLookup = async () => {
  try {
    const response = await accountingApi.getChartOfAccounts({ per_page: 250, status: 'active' })
    coaLookup.value = response.data.data
  } catch {
    coaLookup.value = []
  }
}

const loadPaymentAccountLookup = async () => {
  try {
    const response = await accountingApi.getPaymentAccounts({ per_page: 250 })
    paymentAccountLookup.value = response.data.data
  } catch {
    paymentAccountLookup.value = []
  }
}

const warmPaymentLookups = () => {
  loadCoaLookup()
  loadPaymentAccountLookup()
}

const openCreateModal = () => {
  if (!canManageAccounts.value) return
  modal.mode = 'create'
  modal.item = null
  modal.show = true
  formKey.value += 1
  loadCoaLookup()
}

const openEditModal = (item) => {
  if (!canManageAccounts.value) return
  modal.mode = 'edit'
  modal.item = item
  modal.show = true
  formKey.value += 1
  loadCoaLookup()
}

const closeModal = () => {
  modal.show = false
  modal.item = null
}

const openTransferModal = () => {
  if (!canManageAccounts.value) return
  transferModal.show = true
  transferFormKey.value += 1
  warmPaymentLookups()
}

const closeTransferModal = () => {
  transferModal.show = false
}

const openDeleteModal = (item) => {
  if (!canManageAccounts.value) return
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
      name: values.name,
      account_type: values.account_type,
      account_number: values.account_number || null,
      bank_name: values.bank_name || null,
      opening_balance: Number(values.opening_balance || 0),
      coa_account_id: values.coa_account_id || null,
      note: values.note || null,
      is_active: Boolean(values.is_active),
    }

    if (modal.mode === 'create') {
      await store.createItem(payload)
      showToast('success', 'Payment account created successfully.')
    } else {
      await store.updateItem(modal.item.id, payload)
      showToast('success', 'Payment account updated successfully.')
    }

    closeModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to save the payment account.')
  }
}

const submitTransfer = async (values) => {
  try {
    await store.transfer({
      from_payment_account_id: values.from_payment_account_id,
      to_payment_account_id: values.to_payment_account_id,
      amount: Number(values.amount),
      transaction_date: values.transaction_date,
      note: values.note || null,
    })
    showToast('success', 'Payment account transfer posted successfully.')
    closeTransferModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to post the transfer.')
  }
}

const confirmDelete = async () => {
  if (!deleteDialog.item) return

  try {
    await store.deleteItem(deleteDialog.item.id)
    showToast('success', 'Payment account deleted successfully.')
    closeDeleteModal()
  } catch (error) {
    showToast('danger', error.response?.data?.message || 'Unable to delete the payment account.')
  }
}

onMounted(() => {
  store.fetchItems()
  warmPaymentLookups()
})
</script>





