<template>
  <AppLayout
    :title="t('sales.quotationsPage.title')"
    :subtitle="t('sales.quotationsPage.subtitle')"
    :breadcrumbs="[
      { label: t('layout.nav.dashboard.label'), to: '/dashboard' },
      { label: t('layout.nav.sales.label') },
      { label: t('sales.quotationsPage.breadcrumb') },
    ]"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <FilterPanel
        v-model:expanded="filtersExpanded"
        :title="t('sales.shared.filters.title')"
        :description="t('sales.quotationsPage.filterDescription')"
        :active-count="activeFilterCount"
        :show-clear="activeFilterCount > 0"
        @clear="resetFilters"
      >
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label class="erp-label">{{ t('sales.shared.filters.branch') }}</label>
            <AppSelect
              :model-value="store.filters.branch_id || null"
              :options="branchSelectOptions"
              :placeholder="t('sales.shared.placeholders.allBranches')"
              clearable
              searchable
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
        </div>
      </FilterPanel>

      <DataTable
        :title="t('sales.quotationsPage.tableTitle')"
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
            {{ t('sales.quotationsPage.newQuotation') }}
          </button>
        </template>

        <template #quotation="{ row }">
          <div>
            <div class="font-semibold text-slate-950 dark:text-white">{{ row.sale_number }}</div>
            <div class="mt-1">
              <span class="erp-badge" :class="badgeClass(row.status)">{{ statusLabel(row.status) }}</span>
            </div>
          </div>
        </template>

        <template #customer="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div>{{ row.customer?.name || t('sales.shared.noCustomer') }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {{ row.branch?.name || t('sales.shared.notRecorded') }}
            </div>
          </div>
        </template>

        <template #amount="{ row }">
          <div class="text-sm text-slate-700 dark:text-slate-200">
            <div class="font-semibold text-slate-950 dark:text-white">{{ formatAccountingMoney(row.total_amount) }}</div>
            <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ row.items.length }} {{ t('sales.shared.labels.lines') }}</div>
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
              v-if="canConvertRow(row)"
              type="button"
              class="erp-button-secondary"
              :disabled="store.saving"
              @click="openConvertModal(row)"
            >
              {{ t('sales.shared.actions.convert') }}
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
        mode="quotation"
        :saving="store.saving"
        default-type="quotation"
        :branches="branches"
        :warehouses="warehouses"
        :customers="customers"
        :products="products"
        :register-sessions="registerSessionOptions"
        @close="createModal = false"
        @submit="submitCreate"
      />

      <AppModal :show="convertDialog.show" :title="t('sales.quotationsPage.convertTitle')" :icon="t('sales.quotationsPage.convertIcon')" size="lg" @close="closeConvertModal">
        <div class="space-y-4">
          <div class="text-sm text-slate-600 dark:text-slate-300">{{ convertDialog.quotation?.sale_number }}</div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label">{{ t('sales.shared.filters.type') }}</label>
              <AppSelect
                :model-value="convertDialog.form.type || null"
                :options="convertTypeOptions"
                :placeholder="t('sales.shared.placeholders.selectType')"
                @update:model-value="handleConvertType"
              />
            </div>
            <div>
              <label class="erp-label">{{ t('sales.salesPage.fields.saleDate') }}</label>
              <AppDatePicker
                :model-value="convertDialog.form.sale_date"
                @update:model-value="convertDialog.form.sale_date = $event || ''"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="erp-label">{{ t('sales.salesPage.fields.dueDate') }}</label>
              <AppDatePicker
                :model-value="convertDialog.form.due_date"
                @update:model-value="convertDialog.form.due_date = $event || ''"
              />
            </div>

            <div v-if="convertDialog.form.type === 'pos_sale'">
              <label class="erp-label">{{ t('sales.documentModal.fields.registerSession') }}</label>
              <AppSelect
                :model-value="convertDialog.form.cash_register_session_id || null"
                :options="sessionOptionsForBranch(convertDialog.quotation?.branch_id)"
                :placeholder="t('sales.documentModal.placeholders.selectRegisterSession')"
                clearable
                searchable
                @update:model-value="convertDialog.form.cash_register_session_id = $event || ''"
              />
            </div>
          </div>

          <div>
            <label class="erp-label">{{ t('sales.salesPage.fields.note') }}</label>
            <textarea v-model="convertDialog.form.notes" rows="3" class="erp-input min-h-[6rem]"></textarea>
          </div>

          <div class="erp-form-actions">
            <button type="button" class="erp-button-secondary" :disabled="store.saving" @click="closeConvertModal">
              {{ t('sales.shared.actions.cancel') }}
            </button>
            <button type="button" class="erp-button-primary" :disabled="store.saving" @click="submitConvert">
              {{ t('sales.shared.actions.convert') }}
            </button>
          </div>
        </div>
      </AppModal>

      <AppModal :show="cancelDialog.show" :title="t('sales.shared.actions.cancelDocument')" :icon="t('sales.quotationsPage.cancelIcon')" size="lg" @close="closeCancelModal">
        <div class="space-y-4">
          <div class="text-sm text-slate-600 dark:text-slate-300">{{ cancelDialog.quotation?.sale_number }}</div>
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
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
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
import { useQuotationsStore } from '@stores/sales'
import { formatAccountingMoney, startCase } from '@/utils/accounting'
import { formatHumanDate, formatHumanDateTime } from '@/utils/date'

const { t } = useI18n()
const auth = useAuthStore()
const store = useQuotationsStore()

const filtersExpanded = ref(false)
const createModal = ref(false)
const branches = ref([])
const warehouses = ref([])
const customers = ref([])
const products = ref([])
const registerSessionOptions = ref([])

const alert = reactive({ show: false, type: 'success', title: '', message: '' })
const convertDialog = reactive({
  show: false,
  quotation: null,
  form: { type: 'invoice', sale_date: new Date().toISOString().slice(0, 10), due_date: '', cash_register_session_id: '', notes: '' },
})
const cancelDialog = reactive({ show: false, quotation: null, reason: '' })

const canCreate = computed(() => auth.can('sales.create'))
const canConvert = computed(() => auth.can('sales.create'))
const canCancel = computed(() => auth.can('sales.cancel'))

const columns = [
  { key: 'quotation', label: 'Quotation' },
  { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'actions', label: 'Actions' },
]

const branchSelectOptions = computed(() =>
  branches.value.map((branch) => ({
    value: branch.id,
    label: branch.name,
    description: branch.code || '',
  }))
)

const statusOptions = computed(() => [
  { value: 'quotation', label: t('sales.shared.statuses.quotation') },
  { value: 'converted', label: t('sales.shared.statuses.converted') },
  { value: 'cancelled', label: t('sales.shared.statuses.cancelled') },
])

const convertTypeOptions = computed(() => [
  { value: 'invoice', label: t('sales.shared.types.invoice') },
  { value: 'pos_sale', label: t('sales.shared.types.pos_sale') },
  { value: 'draft', label: t('sales.shared.types.draft') },
  { value: 'suspended', label: t('sales.shared.types.suspended') },
])

const activeFilterCount = computed(() =>
  [store.filters.branch_id, store.filters.status].filter(Boolean).length
)

const badgeClass = (value) => {
  const key = String(value || '').toLowerCase()
  if (['quotation', 'draft'].includes(key)) return 'erp-badge-info'
  if (['converted'].includes(key)) return 'erp-badge-success'
  if (['cancelled'].includes(key)) return 'erp-badge-danger'
  return 'erp-badge-neutral'
}

const statusLabel = (status) => {
  const translated = t(`sales.shared.statuses.${status}`)
  return translated === `sales.shared.statuses.${status}` ? startCase(status) : translated
}

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

const sessionOptionsForBranch = (branchId) =>
  registerSessionOptions.value
    .filter((session) => !branchId || session.branch_id === branchId)
    .map((session) => ({
      value: session.id,
      label: session.label,
      description: session.description,
    }))

const submitCreate = async (payload) => {
  if (payload?.error) {
    showToast('danger', payload.error)
    return
  }

  try {
    await store.createItem(payload)
    createModal.value = false
    showToast('success', t('sales.quotationsPage.toast.created'))
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.quotationsPage.toast.createFailed'))
  }
}

const handleSearch = (value) => store.fetchItems({ search: value, page: 1 })
const handlePageChange = (page) => store.fetchItems({ page })
const handlePerPageChange = (perPage) => store.fetchItems({ per_page: perPage, page: 1 })
const handleBranchFilter = (value) => store.fetchItems({ branch_id: value || '', page: 1 })
const handleStatusFilter = (value) => store.fetchItems({ status: value || '', page: 1 })

const resetFilters = () => {
  store.fetchItems({ branch_id: '', status: '', page: 1 })
}

const canConvertRow = (row) => canConvert.value && row.status === 'quotation'
const canCancelRow = (row) => canCancel.value && row.status === 'quotation'

const openConvertModal = (quotation) => {
  convertDialog.show = true
  convertDialog.quotation = quotation
  convertDialog.form.type = 'invoice'
  convertDialog.form.sale_date = new Date().toISOString().slice(0, 10)
  convertDialog.form.due_date = ''
  convertDialog.form.cash_register_session_id = ''
  convertDialog.form.notes = ''
}

const handleConvertType = (value) => {
  convertDialog.form.type = value || 'invoice'
  if (convertDialog.form.type !== 'pos_sale') {
    convertDialog.form.cash_register_session_id = ''
  }
}

const closeConvertModal = () => {
  convertDialog.show = false
  convertDialog.quotation = null
}

const submitConvert = async () => {
  if (!convertDialog.quotation) {
    return
  }

  if (convertDialog.form.type === 'pos_sale' && !convertDialog.form.cash_register_session_id) {
    showToast('danger', t('sales.documentModal.validation.missingRegisterSession'))
    return
  }

  try {
    await store.convertItem(convertDialog.quotation.id, {
      type: convertDialog.form.type,
      sale_date: convertDialog.form.sale_date || null,
      due_date: convertDialog.form.due_date || null,
      cash_register_session_id: convertDialog.form.type === 'pos_sale' ? convertDialog.form.cash_register_session_id || null : null,
      notes: convertDialog.form.notes || null,
    })
    closeConvertModal()
    showToast('success', t('sales.quotationsPage.toast.converted'))
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.quotationsPage.toast.convertFailed'))
  }
}

const openCancelModal = (quotation) => {
  cancelDialog.show = true
  cancelDialog.quotation = quotation
  cancelDialog.reason = ''
}

const closeCancelModal = () => {
  cancelDialog.show = false
  cancelDialog.quotation = null
  cancelDialog.reason = ''
}

const submitCancel = async () => {
  if (!cancelDialog.quotation) {
    return
  }

  try {
    await store.cancelItem(cancelDialog.quotation.id, { reason: cancelDialog.reason || null })
    closeCancelModal()
    showToast('success', t('sales.quotationsPage.toast.cancelled'))
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.quotationsPage.toast.cancelFailed'))
  }
}

onMounted(async () => {
  await Promise.all([
    store.fetchItems(),
    loadBranches(),
    loadWarehouses(),
    loadCustomers(),
    loadProducts(),
    loadRegisterSessions(),
  ])
})
</script>
