<template>
  <AppLayout
    :title="t('sales.salesPage.title')"
    :subtitle="t('sales.salesPage.subtitle')"
    :breadcrumbs="[
      { label: t('layout.nav.dashboard.label'), to: '/dashboard' },
      { label: t('layout.nav.sales.label') },
      { label: t('sales.salesPage.breadcrumb') },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <FilterPanel
        v-model:expanded="filtersExpanded"
        :title="t('sales.shared.filters.title')"
        :description="t('sales.salesPage.filterDescription')"
        :active-count="activeFilterCount"
        :show-clear="activeFilterCount > 0"
        @clear="resetFilters"
      >
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label class="erp-label">{{ t('sales.shared.filters.branch') }}</label>
            <AppSelect
              :model-value="store.filters.branch_id || null"
              :options="branchSelectOptions"
              :placeholder="t('sales.shared.placeholders.allBranches')"
              :search-placeholder="t('sales.shared.placeholders.searchBranches')"
              searchable
              clearable
              @update:model-value="handleBranchFilter"
            />
          </div>

          <div>
            <label class="erp-label">{{ t('sales.shared.filters.status') }}</label>
            <AppSelect
              :model-value="store.filters.status || null"
              :options="statusOptions"
              :placeholder="t('sales.shared.placeholders.allStatuses')"
              clearable
              @update:model-value="handleStatusFilter"
            />
          </div>

          <div>
            <label class="erp-label">{{ t('sales.shared.filters.type') }}</label>
            <AppSelect
              :model-value="store.filters.type || null"
              :options="typeOptions"
              :placeholder="t('sales.shared.placeholders.allTypes')"
              clearable
              @update:model-value="handleTypeFilter"
            />
          </div>
        </div>
      </FilterPanel>

      <DataTable
        :title="t('sales.salesPage.tableTitle')"
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
          <button v-if="canCreate" type="button" class="erp-button-primary" @click="createModal = true">
            <i class="fa-solid fa-plus"></i>
            {{ t('sales.salesPage.newSale') }}
          </button>
        </template>

        <template #document="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.sale_number }}</div>
            <div class="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span class="erp-badge" :class="badgeClass(row.status)">{{ statusLabel(row.status) }}</span>
              <span class="erp-badge" :class="badgeClass(row.type)">{{ typeLabel(row.type) }}</span>
            </div>
          </div>
        </template>

        <template #customer="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.customer?.name || t('sales.shared.noCustomer') }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.creator?.name || t('sales.shared.notRecorded') }}
            </div>
          </div>
        </template>

        <template #location="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.branch?.name || t('sales.shared.notRecorded') }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.warehouse?.name || t('sales.shared.notRecorded') }}
            </div>
          </div>
        </template>

        <template #total="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div class="font-semibold text-slate-950 dark:text-white">{{ formatAccountingMoney(row.total_amount) }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.items.length }} {{ t('sales.shared.labels.lines') }}
            </div>
          </div>
        </template>

        <template #payment="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <span class="erp-badge" :class="badgeClass(row.payment_status)">{{ paymentStatusLabel(row.payment_status) }}</span>
            <div class="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {{ t('sales.shared.labels.paid') }}: {{ formatAccountingMoney(row.paid_amount) }}
            </div>
          </div>
        </template>

        <template #date="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ formatHumanDate(row.sale_date) }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ formatHumanDateTime(row.created_at) }}</div>
          </div>
        </template>

        <template #actions="{ row }">
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-if="canConfirmRow(row)"
              type="button"
              class="erp-button-secondary"
              :disabled="store.saving"
              @click="confirmSale(row)"
            >
              {{ t('sales.shared.actions.confirm') }}
            </button>
            <button
              v-if="canCompleteRow(row)"
              type="button"
              class="erp-button-secondary"
              :disabled="store.saving"
              @click="completeSale(row)"
            >
              {{ t('sales.shared.actions.complete') }}
            </button>
            <button
              v-if="canRecordPaymentRow(row)"
              type="button"
              class="erp-button-secondary"
              :disabled="store.saving"
              @click="openPaymentModal(row)"
            >
              {{ t('sales.shared.actions.recordPayment') }}
            </button>
            <button
              v-if="canReturnRow(row)"
              type="button"
              class="erp-button-secondary"
              :disabled="store.saving"
              @click="openReturnModal(row)"
            >
              {{ t('sales.shared.actions.recordReturn') }}
            </button>
            <button
              v-if="canCancelRow(row)"
              type="button"
              class="erp-button-secondary text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
              :disabled="store.saving"
              @click="openCancelModal(row)"
            >
              {{ t('sales.shared.actions.cancelDocument') }}
            </button>
          </div>
        </template>
      </DataTable>

      <SaleDocumentModal
        :show="createModal"
        mode="sale"
        :saving="store.saving"
        default-type="invoice"
        :document-type-options="createTypeOptions"
        :branches="branches"
        :warehouses="warehouses"
        :customers="customers"
        :products="products"
        :register-sessions="registerSessionOptions"
        @close="createModal = false"
        @submit="submitCreate"
      />

      <AppModal :show="paymentDialog.show" :title="t('sales.salesPage.paymentTitle')" :icon="t('sales.salesPage.paymentIcon')" size="lg" @close="closePaymentModal">
        <div class="space-y-4">
          <div>
            <div class="text-sm font-semibold text-slate-950 dark:text-white">{{ paymentDialog.sale?.sale_number }}</div>
            <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {{ t('sales.salesPage.outstandingBalance') }}: {{ formatAccountingMoney(paymentDialog.outstanding) }}
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label">{{ t('sales.salesPage.fields.paymentAccount') }}</label>
              <AppSelect
                :model-value="paymentDialog.form.payment_account_id || null"
                :options="paymentAccountOptions"
                :placeholder="t('sales.salesPage.placeholders.selectPaymentAccount')"
                :search-placeholder="t('sales.salesPage.placeholders.searchPaymentAccounts')"
                searchable
                @update:model-value="paymentDialog.form.payment_account_id = $event || ''"
              />
            </div>

            <div>
              <label class="erp-label">{{ t('sales.salesPage.fields.paymentMethod') }}</label>
              <AppSelect
                :model-value="paymentDialog.form.method || null"
                :options="paymentMethodOptions"
                :placeholder="t('sales.salesPage.placeholders.selectPaymentMethod')"
                @update:model-value="paymentDialog.form.method = $event || 'cash'"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="erp-label">{{ t('sales.salesPage.fields.amount') }}</label>
              <input v-model.number="paymentDialog.form.amount" type="number" min="0.01" step="0.01" class="erp-input" />
            </div>

            <div>
              <label class="erp-label">{{ t('sales.salesPage.fields.paymentDate') }}</label>
              <AppDatePicker
                :model-value="paymentDialog.form.payment_date"
                @update:model-value="paymentDialog.form.payment_date = $event || ''"
              />
            </div>

            <div>
              <label class="erp-label">{{ t('sales.salesPage.fields.reference') }}</label>
              <input v-model="paymentDialog.form.reference" type="text" class="erp-input" />
            </div>
          </div>

          <div>
            <label class="erp-label">{{ t('sales.salesPage.fields.note') }}</label>
            <textarea v-model="paymentDialog.form.note" rows="3" class="erp-input min-h-[6rem]"></textarea>
          </div>

          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closePaymentModal">
              {{ t('sales.shared.actions.cancel') }}
            </button>
            <button type="button" class="erp-button-primary" :disabled="store.saving" @click="submitPayment">
              {{ t('sales.shared.actions.recordPayment') }}
            </button>
          </div>
        </div>
      </AppModal>

      <AppModal :show="cancelDialog.show" :title="t('sales.shared.actions.cancelDocument')" :icon="t('sales.salesPage.cancelIcon')" size="lg" @close="closeCancelModal">
        <div class="space-y-4">
          <div class="text-sm text-slate-600 dark:text-slate-300">
            {{ cancelDialog.sale?.sale_number }}
          </div>
          <div>
            <label class="erp-label">{{ t('sales.salesPage.fields.reason') }}</label>
            <textarea v-model="cancelDialog.reason" rows="4" class="erp-input min-h-[7rem]"></textarea>
          </div>
          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeCancelModal">
              {{ t('sales.shared.actions.keepDocument') }}
            </button>
            <button type="button" class="erp-button-primary" :disabled="store.saving" @click="submitCancel">
              {{ t('sales.shared.actions.confirmCancellation') }}
            </button>
          </div>
        </div>
      </AppModal>

      <AppModal :show="returnDialog.show" :title="t('sales.salesPage.returnTitle')" :icon="t('sales.salesPage.returnIcon')" size="xl" @close="closeReturnModal">
        <div class="space-y-5">
          <div>
            <div class="text-sm font-semibold text-slate-950 dark:text-white">{{ returnDialog.sale?.sale_number }}</div>
            <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {{ t('sales.salesPage.returnHint') }}
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label">{{ t('sales.salesPage.fields.returnDate') }}</label>
              <AppDatePicker
                :model-value="returnDialog.form.return_date"
                @update:model-value="returnDialog.form.return_date = $event || ''"
              />
            </div>

            <div>
              <label class="erp-label">{{ t('sales.salesPage.fields.refundMethod') }}</label>
              <AppSelect
                :model-value="returnDialog.form.refund_method || null"
                :options="refundMethodOptions"
                :placeholder="t('sales.salesPage.placeholders.selectRefundMethod')"
                clearable
                @update:model-value="returnDialog.form.refund_method = $event || ''"
              />
            </div>
          </div>

          <div class="space-y-4">
            <article
              v-for="item in returnDialog.items"
              :key="item.sale_item_id"
              class="rounded-[20px] border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/35"
            >
              <div class="grid gap-4 md:grid-cols-[1.8fr,0.9fr,1.2fr]">
                <div>
                  <div class="font-semibold text-slate-950 dark:text-white">{{ item.label }}</div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {{ t('sales.salesPage.soldQty') }}: {{ item.max_quantity }}
                  </div>
                </div>
                <div>
                  <label class="erp-label">{{ t('sales.salesPage.fields.returnQuantity') }}</label>
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="0"
                    :max="item.max_quantity"
                    step="0.01"
                    class="erp-input"
                  />
                </div>
                <div v-if="item.serialOptions.length || item.lotOptions.length" class="space-y-4">
                  <div v-if="item.serialOptions.length">
                    <label class="erp-label">{{ t('sales.salesPage.fields.serials') }}</label>
                    <AppSelect
                      :model-value="item.serial_ids"
                      :options="item.serialOptions"
                      multiple
                      searchable
                      :placeholder="t('sales.salesPage.placeholders.selectSerials')"
                      @update:model-value="updateReturnSerials(item, $event)"
                    />
                  </div>
                  <div v-if="item.lotOptions.length">
                    <label class="erp-label">{{ t('sales.salesPage.fields.lot') }}</label>
                    <AppSelect
                      :model-value="item.lot_id || null"
                      :options="item.lotOptions"
                      :placeholder="t('sales.salesPage.placeholders.selectLot')"
                      clearable
                      @update:model-value="item.lot_id = $event || ''"
                    />
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div>
            <label class="erp-label">{{ t('sales.salesPage.fields.note') }}</label>
            <textarea v-model="returnDialog.form.notes" rows="3" class="erp-input min-h-[6rem]"></textarea>
          </div>

          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeReturnModal">
              {{ t('sales.shared.actions.cancel') }}
            </button>
            <button type="button" class="erp-button-primary" :disabled="store.saving" @click="submitReturn">
              {{ t('sales.shared.actions.recordReturn') }}
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as accountingApi from '@api/accounting'
import * as branchesApi from '@api/branches'
import * as customersApi from '@api/customers'
import * as productsApi from '@api/products'
import * as salesApi from '@api/sales'
import * as warehousesApi from '@api/warehouses'
import SaleDocumentModal from '@components/sales/SaleDocumentModal.vue'
import AppAlert from '@components/ui/AppAlert.vue'
import AppDatePicker from '@components/ui/AppDatePicker.vue'
import AppModal from '@components/ui/AppModal.vue'
import AppSelect from '@components/ui/AppSelect.vue'
import DataTable from '@components/ui/DataTable.vue'
import FilterPanel from '@components/ui/FilterPanel.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useSalesStore } from '@stores/sales'
import { formatAccountingMoney, startCase } from '@/utils/accounting'
import { formatHumanDate, formatHumanDateTime } from '@/utils/date'

const { t } = useI18n()
const auth = useAuthStore()
const store = useSalesStore()

const filtersExpanded = ref(false)
const createModal = ref(false)
const branches = ref([])
const warehouses = ref([])
const customers = ref([])
const products = ref([])
const paymentAccounts = ref([])
const registerSessionOptions = ref([])

const alert = reactive({ show: false, type: 'success', title: '', message: '' })
const paymentDialog = reactive({
  show: false,
  sale: null,
  outstanding: 0,
  form: { payment_account_id: '', amount: '', method: 'cash', payment_date: new Date().toISOString().slice(0, 10), reference: '', note: '' },
})
const cancelDialog = reactive({ show: false, sale: null, reason: '' })
const returnDialog = reactive({ show: false, sale: null, form: { return_date: new Date().toISOString().slice(0, 10), refund_method: 'credit_note', notes: '' }, items: [] })

const canCreate = computed(() => auth.can('sales.create'))
const canConfirm = computed(() => auth.can('sales.confirm'))
const canComplete = computed(() => auth.can('sales.complete'))
const canCancel = computed(() => auth.can('sales.cancel'))
const canRecordPayment = computed(() => auth.can('payments.create'))
const canRecordReturn = computed(() => auth.can('sales.return'))

const columns = [
  { key: 'document', label: 'Document' },
  { key: 'customer', label: 'Customer' },
  { key: 'location', label: 'Location' },
  { key: 'total', label: 'Total' },
  { key: 'payment', label: 'Payment' },
  { key: 'date', label: 'Date' },
  { key: 'actions', label: 'Actions' },
]

const createTypeOptions = computed(() => [
  { value: 'invoice', label: t('sales.shared.types.invoice') },
  { value: 'pos_sale', label: t('sales.shared.types.pos_sale') },
  { value: 'draft', label: t('sales.shared.types.draft') },
  { value: 'suspended', label: t('sales.shared.types.suspended') },
])

const typeOptions = createTypeOptions

const statusOptions = computed(() => [
  { value: 'draft', label: t('sales.shared.statuses.draft') },
  { value: 'confirmed', label: t('sales.shared.statuses.confirmed') },
  { value: 'completed', label: t('sales.shared.statuses.completed') },
  { value: 'cancelled', label: t('sales.shared.statuses.cancelled') },
  { value: 'returned', label: t('sales.shared.statuses.returned') },
  { value: 'suspended', label: t('sales.shared.statuses.suspended') },
])

const branchSelectOptions = computed(() =>
  branches.value.map((branch) => ({
    value: branch.id,
    label: branch.name,
    description: branch.code || '',
  }))
)

const paymentAccountOptions = computed(() =>
  paymentAccounts.value.map((account) => ({
    value: account.id,
    label: account.name,
    description: startCase(account.type || account.account_type || ''),
  }))
)

const paymentMethodOptions = computed(() => [
  { value: 'cash', label: t('sales.shared.methods.cash') },
  { value: 'card', label: t('sales.shared.methods.card') },
  { value: 'bank_transfer', label: t('sales.shared.methods.bank_transfer') },
  { value: 'cheque', label: t('sales.shared.methods.cheque') },
  { value: 'other', label: t('sales.shared.methods.other') },
])

const refundMethodOptions = computed(() => [
  { value: 'cash', label: t('sales.shared.methods.cash') },
  { value: 'credit_note', label: t('sales.shared.methods.credit_note') },
  { value: 'bank_transfer', label: t('sales.shared.methods.bank_transfer') },
  { value: 'reward_points', label: t('sales.shared.methods.reward_points') },
])

const activeFilterCount = computed(() =>
  [store.filters.branch_id, store.filters.status, store.filters.type].filter(Boolean).length
)

const badgeClass = (value) => {
  const key = String(value || '').toLowerCase()

  if (['completed', 'paid', 'invoice', 'pos_sale', 'cash'].includes(key)) return 'erp-badge-success'
  if (['confirmed', 'partial', 'draft'].includes(key)) return 'erp-badge-info'
  if (['returned', 'cancelled', 'overdue'].includes(key)) return 'erp-badge-danger'
  return 'erp-badge-neutral'
}

const translateKey = (path, fallback) => {
  const translated = t(path)
  return translated === path ? fallback : translated
}

const statusLabel = (status) => translateKey(`sales.shared.statuses.${status}`, startCase(status))
const typeLabel = (type) => translateKey(`sales.shared.types.${type}`, startCase(type))
const paymentStatusLabel = (status) => translateKey(`sales.shared.paymentStatuses.${status}`, startCase(status))

const showToast = (type, message) => {
  alert.type = type
  alert.title = t(type === 'danger' ? 'sales.shared.toast.errorTitle' : 'sales.shared.toast.successTitle')
  alert.message = message
  alert.show = false
  requestAnimationFrame(() => { alert.show = true })
}

const loadBranches = async () => {
  if (!auth.isBranchScopeBypassed) {
    branches.value = auth.allowedBranches.map((branch) => ({ ...branch }))
    return
  }

  try {
    const response = await branchesApi.getBranches({ per_page: 250 })
    branches.value = response.data.data
  } catch {
    branches.value = []
  }
}

const loadWarehouses = async () => {
  try {
    const response = await warehousesApi.getWarehouses({ per_page: 250 })
    const allWarehouses = response.data.data
    warehouses.value = auth.isBranchScopeBypassed
      ? allWarehouses
      : allWarehouses.filter((warehouse) => auth.allowedBranches.some((branch) => branch.id === warehouse.branch_id))
  } catch {
    warehouses.value = []
  }
}

const loadCustomers = async () => {
  try {
    const response = await customersApi.getCustomers({ per_page: 250, status: 'active' })
    customers.value = response.data.data
  } catch {
    customers.value = []
  }
}

const loadProducts = async () => {
  try {
    const response = await productsApi.getProducts({ per_page: 250 })
    products.value = response.data.data.filter((product) => product.is_active)
  } catch {
    products.value = []
  }
}

const loadPaymentAccounts = async () => {
  try {
    const response = await accountingApi.getPaymentAccounts({ per_page: 250, status: 'active' })
    paymentAccounts.value = response.data.data
  } catch {
    paymentAccounts.value = []
  }
}

const loadRegisterSessions = async () => {
  try {
    const response = await salesApi.getCashRegisters({ per_page: 250, status: 'active' })
    registerSessionOptions.value = response.data.data
      .filter((register) => register.current_open_session)
      .map((register) => ({
        id: register.current_open_session.id,
        branch_id: register.branch_id,
        label: `${register.name} • ${register.branch?.name || t('sales.shared.notRecorded')}`,
        description: formatHumanDateTime(register.current_open_session.opened_at),
      }))
  } catch {
    registerSessionOptions.value = []
  }
}

const submitCreate = async (payload) => {
  if (payload?.error) {
    showToast('danger', payload.error)
    return
  }

  try {
    await store.createItem(payload)
    createModal.value = false
    showToast('success', t('sales.salesPage.toast.created'))
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.salesPage.toast.createFailed'))
  }
}

const handleSearch = (value) => store.fetchItems({ search: value, page: 1 })
const handlePageChange = (page) => store.fetchItems({ page })
const handlePerPageChange = (perPage) => store.fetchItems({ per_page: perPage, page: 1 })
const handleBranchFilter = (value) => store.fetchItems({ branch_id: value || '', page: 1 })
const handleStatusFilter = (value) => store.fetchItems({ status: value || '', page: 1 })
const handleTypeFilter = (value) => store.fetchItems({ type: value || '', page: 1 })

const resetFilters = () => {
  store.fetchItems({ branch_id: '', status: '', type: '', page: 1 })
}

const canConfirmRow = (row) => canConfirm.value && ['draft', 'suspended'].includes(row.status)
const canCompleteRow = (row) => canComplete.value && row.status === 'confirmed'
const canCancelRow = (row) => canCancel.value && ['draft', 'suspended', 'confirmed'].includes(row.status)
const canRecordPaymentRow = (row) => canRecordPayment.value && row.status === 'completed' && ['unpaid', 'partial'].includes(row.payment_status)
const canReturnRow = (row) => canRecordReturn.value && ['completed', 'returned'].includes(row.status)

const confirmSale = async (row) => {
  try {
    await store.confirmItem(row.id)
    showToast('success', t('sales.salesPage.toast.confirmed', { number: row.sale_number }))
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.salesPage.toast.confirmFailed'))
  }
}

const completeSale = async (row) => {
  try {
    await store.completeItem(row.id)
    showToast('success', t('sales.salesPage.toast.completed', { number: row.sale_number }))
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.salesPage.toast.completeFailed'))
  }
}

const openPaymentModal = (sale) => {
  const total = Number(sale.total_amount || 0)
  const paid = Number(sale.paid_amount || 0)

  paymentDialog.show = true
  paymentDialog.sale = sale
  paymentDialog.outstanding = Math.max(total - paid, 0)
  paymentDialog.form.payment_account_id = ''
  paymentDialog.form.amount = paymentDialog.outstanding
  paymentDialog.form.method = 'cash'
  paymentDialog.form.payment_date = new Date().toISOString().slice(0, 10)
  paymentDialog.form.reference = ''
  paymentDialog.form.note = ''
}

const closePaymentModal = () => {
  paymentDialog.show = false
  paymentDialog.sale = null
}

const submitPayment = async () => {
  if (!paymentDialog.sale || !paymentDialog.form.payment_account_id || Number(paymentDialog.form.amount || 0) <= 0) {
    showToast('danger', t('sales.salesPage.toast.invalidPayment'))
    return
  }

  try {
    await store.recordPayment(paymentDialog.sale.id, {
      payment_account_id: paymentDialog.form.payment_account_id,
      amount: Number(paymentDialog.form.amount),
      method: paymentDialog.form.method,
      payment_date: paymentDialog.form.payment_date,
      reference: paymentDialog.form.reference || null,
      note: paymentDialog.form.note || null,
    })
    closePaymentModal()
    showToast('success', t('sales.salesPage.toast.paymentRecorded'))
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.salesPage.toast.paymentFailed'))
  }
}

const openCancelModal = (sale) => {
  cancelDialog.show = true
  cancelDialog.sale = sale
  cancelDialog.reason = ''
}

const closeCancelModal = () => {
  cancelDialog.show = false
  cancelDialog.sale = null
  cancelDialog.reason = ''
}

const submitCancel = async () => {
  if (!cancelDialog.sale) {
    return
  }

  const saleNumber = cancelDialog.sale.sale_number

  try {
    await store.cancelItem(cancelDialog.sale.id, { reason: cancelDialog.reason || null })
    closeCancelModal()
    showToast('success', t('sales.salesPage.toast.cancelled', { number: saleNumber }))
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.salesPage.toast.cancelFailed'))
  }
}

const openReturnModal = (sale) => {
  returnDialog.show = true
  returnDialog.sale = sale
  returnDialog.form.return_date = new Date().toISOString().slice(0, 10)
  returnDialog.form.refund_method = 'credit_note'
  returnDialog.form.notes = ''
  returnDialog.items = (sale.items || []).map((item) => ({
    sale_item_id: item.id,
    quantity: 0,
    max_quantity: Number(item.quantity || 0),
    label: item.product?.name || t('sales.shared.notRecorded'),
    lot_id: '',
    lotOptions: (item.lots || []).map((lot) => ({
      value: lot.lot_id || lot.lot?.id,
      label: lot.lot?.lot_number || lot.lot?.name || t('sales.shared.notRecorded'),
      description: `${t('sales.salesPage.available')}: ${lot.quantity}`,
    })),
    serial_ids: [],
    serialOptions: (item.serials || []).map((serial) => ({
      value: serial.serial_id || serial.serial?.id,
      label: serial.serial?.serial_number || t('sales.shared.notRecorded'),
    })),
  }))
}

const updateReturnSerials = (item, values) => {
  item.serial_ids = Array.isArray(values) ? values : []
  item.quantity = item.serial_ids.length
}

const closeReturnModal = () => {
  returnDialog.show = false
  returnDialog.sale = null
  returnDialog.items = []
}

const submitReturn = async () => {
  if (!returnDialog.sale) {
    return
  }

  const items = returnDialog.items
    .filter((item) => Number(item.quantity || 0) > 0)
    .map((item) => ({
      sale_item_id: item.sale_item_id,
      quantity: Number(item.quantity),
      lot_id: item.lot_id || null,
      serial_ids: item.serial_ids.length ? item.serial_ids : undefined,
    }))

  if (!items.length) {
    showToast('danger', t('sales.salesPage.toast.invalidReturn'))
    return
  }

  try {
    await store.recordReturn(returnDialog.sale.id, {
      return_date: returnDialog.form.return_date,
      refund_method: returnDialog.form.refund_method || null,
      notes: returnDialog.form.notes || null,
      items,
    })
    closeReturnModal()
    showToast('success', t('sales.salesPage.toast.returnRecorded'))
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.salesPage.toast.returnFailed'))
  }
}

onMounted(async () => {
  await Promise.all([
    store.fetchItems(),
    loadBranches(),
    loadWarehouses(),
    loadCustomers(),
    loadProducts(),
    loadPaymentAccounts(),
    loadRegisterSessions(),
  ])
})
</script>
