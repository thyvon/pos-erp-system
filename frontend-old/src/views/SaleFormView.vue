<template>
  <AppLayout
    :title="pageTitle"
    :subtitle="pageSubtitle"
    :breadcrumbs="breadcrumbs"
  >
    <div class="space-y-6">
      <AppAlert v-model:show="alert.show" :type="alert.type" :title="alert.title" :message="alert.message" />

      <div
        v-if="loadError"
        key="sale-form-error"
        class="rounded-[5px] border border-rose-200/70 bg-rose-50/80 px-5 py-4 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"
      >
        <div class="font-semibold">{{ t('sales.formPage.loadErrorTitle') }}</div>
        <div class="mt-1">{{ loadError }}</div>
      </div>

      <PageBlurSkeleton v-else-if="loading" key="sale-form-loading" variant="form" />

      <div v-else key="sale-form-loaded" class="space-y-6">
        <section class="erp-form-page">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-slate-950 dark:text-white">
                {{ headerTitle }}
              </h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {{ headerSubtitle }}
              </p>
            </div>

            <div class="flex items-center gap-2 self-start">
              <span class="erp-badge erp-badge-info gap-2 px-3">
                <i class="fa-solid fa-file-invoice-dollar"></i>
                {{ badgeLabel }}
              </span>
            </div>
          </div>
        </section>

        <SaleDocumentForm
          :key="formRenderKey"
          :show="true"
          mode="sale"
          :is-editing="isEditMode"
          :saving="store.saving"
          default-type="invoice"
          :document-type-options="typeOptions"
          :branches="branches"
          :warehouses="warehouses"
          :customers="customers"
          :products="products"
          :register-sessions="registerSessionOptions"
          :tax-rates="taxRates"
          :initial-values="formInitialValues"
          @cancel="goBack"
          @submit="handleSubmit"
        />
      </div>

      <SalePaymentModal
        :show="paymentDialog.show"
        :title="t('sales.formPage.finalizePaymentTitle')"
        :icon="t('sales.formPage.finalizePaymentIcon')"
        :summary-label="t('sales.documentModal.summary.grandTotal')"
        :summary-value="paymentDialog.grandTotal"
        :form="paymentDialog.payments[0]"
        :payments="paymentDialog.payments"
        :payment-account-options="paymentAccountOptions"
        :payment-method-options="paymentMethodOptions"
        :account-label="t('sales.salesPage.fields.paymentAccount')"
        :method-label="t('sales.salesPage.fields.paymentMethod')"
        :amount-label="t('sales.salesPage.fields.amount')"
        :payment-date-label="t('sales.salesPage.fields.paymentDate')"
        :reference-label="t('sales.salesPage.fields.reference')"
        :note-label="t('sales.salesPage.fields.note')"
        :account-placeholder="t('sales.salesPage.placeholders.selectPaymentAccount')"
        :account-search-placeholder="t('sales.salesPage.placeholders.searchPaymentAccounts')"
        :account-empty-text="t('sales.documentModal.placeholders.noPaymentAccounts')"
        :method-placeholder="t('sales.salesPage.placeholders.selectPaymentMethod')"
        :account-hint="t('sales.formPage.finalizePaymentHint')"
        show-account-hint
        :error="paymentDialog.error"
        :saving="store.saving"
        allow-multiple-rows
        :cancel-label="t('sales.shared.actions.cancel')"
        :confirm-label="t('sales.shared.actions.finalizeSale')"
        @close="closePaymentDialog"
        @add-row="addPaymentRow"
        @remove-row="removePaymentRow"
        @confirm="confirmFinalize"
      >
      </SalePaymentModal>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import * as accountingApi from '@api/accounting'
import * as branchesApi from '@api/branches'
import * as customersApi from '@api/customers'
import * as productsApi from '@api/products'
import * as salesApi from '@api/sales'
import * as taxRatesApi from '@api/taxRates'
import * as warehousesApi from '@api/warehouses'
import SaleDocumentForm from '@components/sales/SaleDocumentForm.vue'
import SalePaymentModal from '@components/sales/SalePaymentModal.vue'
import AppAlert from '@components/ui/AppAlert.vue'
import PageBlurSkeleton from '@components/ui/PageBlurSkeleton.vue'
import AppLayout from '@layouts/AppLayout.vue'
import { useAuthStore } from '@stores/auth'
import { useSalesStore } from '@stores/sales'
import { formatHumanDateTime } from '@/utils/date'

const SALES_FLASH_KEY = 'sales_flash'
const QUOTATIONS_FLASH_KEY = 'quotations_flash'

const { t } = useI18n()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const store = useSalesStore()

const loading = ref(true)
const loadError = ref('')
const existingSale = ref(null)
const branches = ref([])
const warehouses = ref([])
const customers = ref([])
const products = ref([])
const registerSessionOptions = ref([])
const paymentAccounts = ref([])
const taxRates = ref([])

const alert = reactive({ show: false, type: 'success', title: '', message: '' })
const createPaymentRow = (overrides = {}) => ({
  payment_account_id: '',
  amount: '',
  method: 'cash',
  payment_date: new Date().toISOString().slice(0, 10),
  reference: '',
  note: '',
  ...overrides,
})
const paymentDialog = reactive({
  show: false,
  grandTotal: 0,
  payload: null,
  error: '',
  payments: [createPaymentRow()],
})

const isEditMode = computed(() => Boolean(route.params.id))
const pageTitle = computed(() => (isEditMode.value ? t('sales.formPage.editTitle') : t('sales.formPage.title')))
const pageSubtitle = computed(() => (isEditMode.value ? t('sales.formPage.editSubtitle') : t('sales.formPage.subtitle')))
const pageBreadcrumb = computed(() => (isEditMode.value ? t('sales.formPage.editBreadcrumb') : t('sales.formPage.breadcrumb')))
const headerTitle = computed(() => (isEditMode.value ? t('sales.formPage.editHeaderTitle') : t('sales.formPage.headerTitle')))
const headerSubtitle = computed(() => (isEditMode.value ? t('sales.formPage.editHeaderSubtitle') : t('sales.formPage.headerSubtitle')))
const badgeLabel = computed(() => {
  if (!isEditMode.value) {
    return t('sales.shared.types.invoice')
  }

  return existingSale.value?.type
    ? t(`sales.shared.types.${existingSale.value.type}`)
    : t('sales.shared.actions.edit')
})
const breadcrumbs = computed(() => [
  { label: t('layout.nav.dashboard.label'), to: '/dashboard' },
  { label: t('layout.nav.sales.label') },
  { label: t('sales.salesPage.breadcrumb'), to: '/sales' },
  { label: pageBreadcrumb.value },
])

const typeOptions = computed(() => {
  const options = [
    { value: 'invoice', label: t('sales.shared.types.invoice') },
    { value: 'pos_sale', label: t('sales.shared.types.pos_sale') },
    { value: 'draft', label: t('sales.shared.types.draft') },
    { value: 'suspended', label: t('sales.shared.types.suspended') },
  ]

  if (existingSale.value?.type === 'quotation') {
    options.push({ value: 'quotation', label: t('sales.shared.types.quotation') })
  }

  return options
})
const paymentAccountOptions = computed(() =>
  paymentAccounts.value.map((account) => ({
    value: account.id,
    label: account.name,
    description: account.account_type || account.type || '',
  }))
)
const paymentMethodOptions = computed(() => [
  { value: 'cash', label: t('sales.shared.methods.cash') },
  { value: 'card', label: t('sales.shared.methods.card') },
  { value: 'bank_transfer', label: t('sales.shared.methods.bank_transfer') },
  { value: 'cheque', label: t('sales.shared.methods.cheque') },
  { value: 'other', label: t('sales.shared.methods.other') },
])

const formRenderKey = computed(() => {
  if (!isEditMode.value) {
    return 'sale-form-create'
  }

  return [
    'sale-form-edit',
    route.params.id || 'unknown',
    existingSale.value?.updated_at || 'pending',
  ].join(':')
})

const formInitialValues = computed(() => normalizeSaleForForm(existingSale.value))

const resolveDiscountAmount = (discountType, discountAmount, baseAmount) => {
  const base = Number(baseAmount || 0)
  const amount = Number(discountAmount || 0)

  if (base <= 0 || amount <= 0) {
    return 0
  }

  if (discountType === 'percentage') {
    return Math.min(base, (base * amount) / 100)
  }

  return Math.min(base, amount)
}

const calculateFinalizeGrandTotal = (payload) => {
  const items = Array.isArray(payload?.items) ? payload.items : []

  const subtotal = items.reduce((carry, item) => {
    const quantity = Number(item.quantity || 0)
    const unitPrice = Number(item.unit_price || 0)
    const gross = quantity * unitPrice
    const lineDiscount = resolveDiscountAmount(item.discount_type, item.discount_amount, gross)
    const grossAfterDiscount = Math.max(0, gross - lineDiscount)
    const taxRate = Number(item.tax_rate || 0)

    if (payload.tax_scope !== 'line' || taxRate <= 0) {
      return carry + grossAfterDiscount
    }

    if (item.tax_rate_type === 'fixed') {
      if (item.tax_type === 'inclusive') {
        return carry + Math.max(0, grossAfterDiscount - Math.min(grossAfterDiscount, taxRate))
      }

      return carry + grossAfterDiscount
    }

    if (item.tax_type === 'inclusive') {
      const taxAmount = grossAfterDiscount - (grossAfterDiscount / (1 + taxRate / 100))
      return carry + Math.max(0, grossAfterDiscount - taxAmount)
    }

    return carry + grossAfterDiscount
  }, 0)

  const orderDiscount = resolveDiscountAmount(payload.discount_type, payload.discount_amount, subtotal)
  const taxableAfterOrderDiscount = Math.max(0, subtotal - orderDiscount)

  const taxAmount = payload.tax_scope === 'sale'
    ? (() => {
      const taxRate = Number(payload.tax_rate || 0)

      if (taxRate <= 0) return 0

      if (payload.tax_rate_type === 'fixed') {
        return Math.min(taxableAfterOrderDiscount, taxRate)
      }

      if (payload.tax_type === 'inclusive') {
        return taxableAfterOrderDiscount - (taxableAfterOrderDiscount / (1 + taxRate / 100))
      }

      return taxableAfterOrderDiscount * (taxRate / 100)
    })()
    : items.reduce((carry, item) => {
      const quantity = Number(item.quantity || 0)
      const unitPrice = Number(item.unit_price || 0)
      const gross = quantity * unitPrice
      const lineDiscount = resolveDiscountAmount(item.discount_type, item.discount_amount, gross)
      const grossAfterDiscount = Math.max(0, gross - lineDiscount)
      const taxRate = Number(item.tax_rate || 0)

      if (taxRate <= 0) return carry

      if (item.tax_rate_type === 'fixed') {
        return carry + Math.min(grossAfterDiscount, taxRate)
      }

      if (item.tax_type === 'inclusive') {
        return carry + (grossAfterDiscount - (grossAfterDiscount / (1 + taxRate / 100)))
      }

      return carry + (grossAfterDiscount * (taxRate / 100))
    }, 0)

  return Math.max(0, taxableAfterOrderDiscount + taxAmount + Number(payload.shipping_charges || 0))
}

const normalizeSaleForForm = (sale) => {
  if (!sale) {
    return null
  }

  return {
    branch_id: sale.branch_id || '',
    warehouse_id: sale.warehouse_id || '',
    customer_id: sale.customer_id || '',
    type: sale.type || 'invoice',
    sale_date: sale.sale_date || '',
    due_date: sale.due_date || '',
    cash_register_session_id: sale.cash_register_session_id || '',
    discount_type: sale.discount_type || '',
    discount_amount: Number(sale.discount_amount || 0),
    tax_scope: sale.tax_scope || 'line',
    tax_rate_id: sale.tax_rate_id || '',
    tax_rate_type: sale.tax_rate_type || sale.tax_rate_record?.type || '',
    tax_rate: Number(sale.tax_rate || sale.tax_rate_record?.rate || 0),
    tax_type: sale.tax_type || 'exclusive',
    shipping_charges: Number(sale.shipping_charges || 0),
    notes: sale.notes || '',
    staff_note: sale.staff_note || '',
    items: Array.isArray(sale.items)
      ? sale.items.map((item) => ({
        product_id: item.product_id || '',
        variation_id: item.variation_id || '',
        sub_unit_id: item.sub_unit_id || '',
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        discount_type: item.discount_type || '',
        discount_amount: Number(item.discount_amount || 0),
        tax_rate_id: item.tax_rate_id || '',
        tax_rate_type: item.tax_rate_type || item.tax_rate_record?.type || '',
        tax_rate_record: item.tax_rate_record || null,
        tax_type: item.tax_type || '',
        tax_rate: Number(item.tax_rate || item.tax_rate_record?.rate || 0),
        unit_cost: Number(item.unit_cost || 0),
        base_unit_price: Number((item.variation?.selling_price ?? item.product?.selling_price ?? item.unit_price) || 0),
        sub_unit_price: Number((item.variation?.sub_unit_selling_price ?? item.product?.sub_unit_selling_price) || 0),
        minimum_selling_price: Number((item.variation?.minimum_selling_price ?? item.product?.minimum_selling_price) || 0),
        product_unit: item.product?.unit || null,
        product_sub_unit: item.product?.sub_unit || null,
        variation_sub_unit: item.variation?.sub_unit || null,
        stock_tracking: item.product?.stock_tracking || 'none',
        product_name: item.product?.name || '',
        variation_name: item.variation?.name || '',
        sku: item.variation?.sku || item.product?.sku || '',
        lot_allocations: Array.isArray(item.lots)
          ? item.lots.map((lotLink) => ({
            lot_id: lotLink.lot_id || '',
            quantity: Number(lotLink.quantity || 0),
          }))
          : [],
        lot_numbers: Array.isArray(item.lots)
          ? item.lots.map((lotLink) => lotLink.lot?.lot_number).filter(Boolean)
          : [],
        serial_ids: Array.isArray(item.serials)
          ? item.serials.map((serialLink) => serialLink.serial_id).filter(Boolean)
          : [],
        serial_numbers: Array.isArray(item.serials)
          ? item.serials.map((serialLink) => serialLink.serial?.serial_number).filter(Boolean)
          : [],
        notes: item.notes || '',
      }))
      : [],
  }
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

  const response = await branchesApi.getBranches({ per_page: 250 })
  branches.value = response.data.data
}

const loadWarehouses = async () => {
  const response = await warehousesApi.getWarehouses({ per_page: 250 })
  const allWarehouses = response.data.data
  warehouses.value = auth.isBranchScopeBypassed
    ? allWarehouses
    : allWarehouses.filter((warehouse) => auth.allowedBranches.some((branch) => branch.id === warehouse.branch_id))
}

const loadCustomers = async () => {
  const response = await customersApi.getCustomers({ per_page: 250, status: 'active' })
  customers.value = response.data.data
}

const loadProducts = async () => {
  const response = await productsApi.getProducts({ per_page: 250 })
  products.value = response.data.data.filter((product) => product.is_active && product.is_for_selling !== false)
}

const loadRegisterSessions = async () => {
  const response = await salesApi.getCashRegisters({ per_page: 250, status: 'active' })
  registerSessionOptions.value = response.data.data
    .filter((register) => register.current_open_session)
    .map((register) => ({
      id: register.current_open_session.id,
      branch_id: register.branch_id,
      label: `${register.name} • ${register.branch?.name || t('sales.shared.notRecorded')}`,
      description: formatHumanDateTime(register.current_open_session.opened_at),
    }))
}

const loadPaymentAccounts = async () => {
  const response = await accountingApi.getPaymentAccounts({ per_page: 250, status: 'active' })
  paymentAccounts.value = response.data.data
}

const loadTaxRates = async () => {
  const response = await taxRatesApi.getTaxRates({ per_page: 250, is_active: true })
  taxRates.value = response.data.data
}

const loadExistingSale = async () => {
  if (!isEditMode.value) {
    existingSale.value = null
    return
  }

  const response = await salesApi.getSale(route.params.id)
  existingSale.value = response.data.data
}

const goBack = () => {
  router.push({ name: 'sales' })
}

const openPaymentDialog = (payload) => {
  paymentDialog.show = true
  paymentDialog.payload = payload
  paymentDialog.grandTotal = calculateFinalizeGrandTotal(payload)
  paymentDialog.error = ''
  paymentDialog.payments = [createPaymentRow({
    payment_date: payload.sale_date || new Date().toISOString().slice(0, 10),
  })]
}

const closePaymentDialog = () => {
  paymentDialog.show = false
  paymentDialog.payload = null
  paymentDialog.error = ''
  paymentDialog.payments = [createPaymentRow()]
}

const addPaymentRow = () => {
  const lastRow = paymentDialog.payments[paymentDialog.payments.length - 1] || {}
  paymentDialog.payments.push(createPaymentRow({
    payment_account_id: lastRow.payment_account_id || '',
    method: lastRow.method || 'cash',
    payment_date: lastRow.payment_date || paymentDialog.payments[0]?.payment_date || new Date().toISOString().slice(0, 10),
  }))
}

const removePaymentRow = (index) => {
  if (paymentDialog.payments.length === 1) {
    return
  }

  paymentDialog.payments.splice(index, 1)
}

const buildFinalizePaymentPayload = () => {
  const paymentRows = paymentDialog.payments
    .map((row) => ({
      payment_account_id: row.payment_account_id || '',
      amount: Number(row.amount || 0),
      method: row.method || 'cash',
      payment_date: row.payment_date || '',
      reference: row.reference?.trim() || '',
      note: row.note?.trim() || '',
    }))

  const hasPaymentIntent = paymentRows.some((row) =>
    row.payment_account_id || row.amount > 0 || row.reference || row.note
  )

  if (!hasPaymentIntent) {
    return null
  }

  const invalidRow = paymentRows.find((row) =>
    (row.payment_account_id || row.amount > 0 || row.reference || row.note)
    && (!row.payment_account_id || row.amount <= 0 || !row.payment_date)
  )

  if (invalidRow) {
    paymentDialog.error = t('sales.documentModal.validation.invalidPayment')
    return false
  }

  const totalAmount = paymentRows.reduce((sum, row) => sum + row.amount, 0)

  if (totalAmount > paymentDialog.grandTotal) {
    paymentDialog.error = t('sales.documentModal.validation.paymentExceedsTotal')
    return false
  }

  return paymentRows
    .filter((row) => row.payment_account_id && row.amount > 0)
    .map((row) => ({
      payment_account_id: row.payment_account_id,
      amount: row.amount,
      method: row.method,
      payment_date: row.payment_date,
      reference: row.reference || null,
      note: row.note || null,
    }))
}

const submitCreate = async (payload) => {
  try {
    const created = await store.createItem(payload)
    const createdSaleId = created?.data?.id || null
    const action = payload.ui_action || 'save'

    if (action === 'save' && createdSaleId && ['invoice', 'pos_sale'].includes(payload.type)) {
      await store.confirmItem(createdSaleId)
    }

    if (action === 'finalize' && createdSaleId) {
      await store.completeItem(createdSaleId)

      for (const payment of payload.payments || []) {
        await store.recordPayment(createdSaleId, payment)
      }
    }

    if (payload.type === 'quotation') {
      sessionStorage.setItem(QUOTATIONS_FLASH_KEY, JSON.stringify({
        type: 'success',
        message: t('sales.quotationsPage.toast.created'),
      }))
      router.push({ name: 'quotations' })
      return
    }

    sessionStorage.setItem(SALES_FLASH_KEY, JSON.stringify({
      type: 'success',
      message: action === 'finalize'
        ? t('sales.salesPage.toast.finalized')
        : ['invoice', 'pos_sale'].includes(payload.type)
          ? t('sales.salesPage.toast.saved')
        : payload.type === 'suspended'
          ? t('sales.salesPage.toast.suspended')
          : payload.type === 'draft'
            ? t('sales.salesPage.toast.savedAsDraft')
            : t('sales.salesPage.toast.created'),
    }))
    goBack()
    return true
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.salesPage.toast.createFailed'))
    return false
  }
}

const submitUpdate = async (payload) => {
  if (!existingSale.value?.id) {
    return false
  }

  try {
    const updated = await store.updateItem(existingSale.value.id, payload)
    const updatedSaleId = updated?.data?.id || existingSale.value.id
    const action = payload.ui_action || 'save'

    if (action === 'save' && ['invoice', 'pos_sale'].includes(payload.type)) {
      await store.confirmItem(updatedSaleId)
    }

    if (action === 'finalize') {
      await store.completeItem(updatedSaleId)

      for (const payment of payload.payments || []) {
        await store.recordPayment(updatedSaleId, payment)
      }
    }

    sessionStorage.setItem(SALES_FLASH_KEY, JSON.stringify({
      type: 'success',
      message: action === 'finalize'
        ? t('sales.salesPage.toast.updatedAndFinalized')
        : ['invoice', 'pos_sale'].includes(payload.type)
          ? t('sales.salesPage.toast.updatedAndReserved')
          : t('sales.salesPage.toast.updated'),
    }))
    goBack()
    return true
  } catch (error) {
    showToast('danger', error.response?.data?.message || t('sales.salesPage.toast.updateFailed'))
    return false
  }
}

const handleSubmit = (payload) => {
  if (payload.ui_action === 'finalize') {
    openPaymentDialog(payload)
    return
  }

  if (isEditMode.value) {
    return submitUpdate(payload)
  }

  return submitCreate(payload)
}

const confirmFinalize = async () => {
  if (!paymentDialog.payload) {
    return
  }

  const payments = buildFinalizePaymentPayload()

  if (payments === false) {
    return
  }

  const payload = {
    ...paymentDialog.payload,
    payments,
  }

  try {
    let success = false

    if (isEditMode.value) {
      success = await submitUpdate(payload)
    } else {
      success = await submitCreate(payload)
    }

    if (success) {
      closePaymentDialog()
    }
  } catch {
    // submitCreate / submitUpdate already surface the toast
  }
}

onMounted(async () => {
  loading.value = true
  loadError.value = ''

  try {
    await Promise.all([
      loadBranches(),
      loadWarehouses(),
      loadCustomers(),
      loadProducts(),
      loadRegisterSessions(),
      loadPaymentAccounts(),
      loadTaxRates(),
      loadExistingSale(),
    ])
  } catch (error) {
    loadError.value = error.response?.data?.message || t('sales.formPage.loadErrorMessage')
  } finally {
    loading.value = false
  }
})
</script>
