import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const toFiniteNumber = (value, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

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

// ─── Factory ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10)

const createPaymentRow = (overrides = {}) => ({
  payment_account_id: '',
  amount: 0,
  method: 'cash',
  reference: '',
  payment_date: today(),
  note: '',
  ...overrides,
})

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePosStore = defineStore('pos', () => {
  const cart = ref([])
  const form = reactive({
    branch_id: '',
    warehouse_id: '',
    customer_id: '',
    cash_register_session_id: '',
    sale_date: today(),
    discount_scope: 'line',
    discount_type: '',
    discount_amount: 0,
    tax_scope: 'line',
    tax_rate_id: '',
    tax_rate_type: '',
    tax_rate: 0,
    tax_type: 'exclusive',
    notes: '',
  })
  const paymentRows = ref([createPaymentRow()])

  // ── Per-line calculation helpers ───────────────────────────────────────────

  const lineGross = (item) =>
    Number(item.quantity || 0) * Number(item.unit_price || 0)

  const lineDiscountAmount = (item) =>
    resolveDiscountAmount(item.discount_type, item.discount_amount, lineGross(item))

  const lineTaxable = (item) => Math.max(0, lineGross(item) - lineDiscountAmount(item))

  const lineBaseAmount = (item) => {
    const grossAfterDiscount = lineTaxable(item)
    const rate = Number(item.tax_rate || 0)

    if (grossAfterDiscount <= 0 || rate <= 0) {
      return grossAfterDiscount
    }

    if (item.tax_rate_type === 'fixed') {
      return item.tax_type === 'inclusive'
        ? Math.max(0, grossAfterDiscount - Math.min(grossAfterDiscount, rate))
        : grossAfterDiscount
    }

    if (item.tax_type === 'inclusive') {
      const taxAmount = grossAfterDiscount - grossAfterDiscount / (1 + rate / 100)
      return Math.max(0, grossAfterDiscount - taxAmount)
    }

    return grossAfterDiscount
  }

  const lineTaxAmount = (item) => {
    const grossAfterDiscount = lineTaxable(item)
    const rate = Number(item.tax_rate || 0)

    if (grossAfterDiscount <= 0 || rate <= 0) {
      return 0
    }

    if (item.tax_rate_type === 'fixed') {
      return Math.min(grossAfterDiscount, rate)
    }

    if (item.tax_type === 'inclusive') {
      return grossAfterDiscount - grossAfterDiscount / (1 + rate / 100)
    }

    return grossAfterDiscount * (rate / 100)
  }

  const lineNetTotal = (item) => {
    const grossAfterDiscount = lineTaxable(item)

    if (item.tax_type === 'inclusive') {
      return grossAfterDiscount
    }

    return grossAfterDiscount + lineTaxAmount(item)
  }

  const lineTotal = (item) => lineNetTotal(item)

  // ── Summary computeds ──────────────────────────────────────────────────────

  const showLineDiscountControls = computed(() => form.discount_scope === 'line')

  const summarySubtotal = computed(() =>
    cart.value.reduce((carry, item) => carry + lineGross(item), 0)
  )

  const subtotal = computed(() =>
    cart.value.reduce((carry, item) => carry + lineBaseAmount(item), 0)
  )

  const totalQuantity = computed(() =>
    cart.value.reduce((carry, item) => carry + Number(item.quantity || 0), 0)
  )

  const lineDiscountTotal = computed(() =>
    cart.value.reduce((carry, item) => carry + lineDiscountAmount(item), 0)
  )

  const orderDiscountAmount = computed(() =>
    resolveDiscountAmount(form.discount_type, form.discount_amount, subtotal.value)
  )

  const totalDiscountAmount = computed(() => lineDiscountTotal.value + orderDiscountAmount.value)

  const documentTaxAmount = computed(() => {
    const grossAfterOrderDiscount = Math.max(0, subtotal.value - orderDiscountAmount.value)
    const rate = Number(form.tax_rate || 0)

    if (grossAfterOrderDiscount <= 0 || rate <= 0 || form.tax_scope !== 'sale') {
      return 0
    }

    if (form.tax_rate_type === 'fixed') {
      return Math.min(grossAfterOrderDiscount, rate)
    }

    if (form.tax_type === 'inclusive') {
      return grossAfterOrderDiscount - grossAfterOrderDiscount / (1 + rate / 100)
    }

    return grossAfterOrderDiscount * (rate / 100)
  })

  const taxTotal = computed(() =>
    form.tax_scope === 'sale'
      ? documentTaxAmount.value
      : cart.value.reduce((carry, item) => carry + lineTaxAmount(item), 0)
  )

  const grandTotal = computed(() =>
    Math.max(0, subtotal.value - orderDiscountAmount.value) + taxTotal.value
  )

  const totalPaid = computed(() =>
    paymentRows.value.reduce((carry, row) => carry + Number(row.amount || 0), 0)
  )

  const changeDue = computed(() => Math.max(0, totalPaid.value - grandTotal.value))

  // ── Actions ────────────────────────────────────────────────────────────────

  const clearCart = () => {
    cart.value = []
    paymentRows.value = [createPaymentRow()]
    form.discount_scope = 'line'
    form.discount_type = ''
    form.discount_amount = 0
    form.tax_scope = 'line'
    form.tax_rate_id = ''
    form.tax_rate_type = ''
    form.tax_rate = 0
    form.tax_type = 'exclusive'
    form.notes = ''
    form.sale_date = today()
  }

  /**
   * Derive the default tax state for a new cart line from the product's
   * embedded tax_rate record. PosView.vue calls this when adding items
   * via the barcode lookup.
   */
  const deriveProductTax = (_productId) => {
    return {
      tax_rate_id: '',
      tax_rate_name: '',
      tax_rate_type: '',
      tax_type: '',
      tax_rate: 0,
    }
  }

  return {
    // state
    cart,
    form,
    paymentRows,

    // computed
    showLineDiscountControls,
    summarySubtotal,
    subtotal,
    lineDiscountTotal,
    orderDiscountAmount,
    totalDiscountAmount,
    documentTaxAmount,
    taxTotal,
    grandTotal,
    totalQuantity,
    totalPaid,
    changeDue,

    // helpers exposed for PosView (used directly, not via storeToRefs)
    createPaymentRow,
    lineGross,
    lineDiscountAmount,
    lineTaxable,
    lineBaseAmount,
    lineTaxAmount,
    lineNetTotal,
    lineTotal,
    deriveProductTax,

    // actions
    clearCart,
  }
})
