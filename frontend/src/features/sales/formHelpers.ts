import type { PaymentAccount } from '@/types/accounting'
import type {
  Sale,
  SaleItem,
  SalePayment,
  SalePaymentCorrectionLinePayload,
  SalePaymentDeletionLinePayload,
  SalePaymentLinePayload,
  SalePayload,
} from '@/types/sales'
import type { SaleFormInput, SaleFormValues } from './schema'

export type DirectPaymentLineInput = NonNullable<SaleFormInput['direct_payments']>[number]

interface BuildSalePaymentChangePayloadsOptions {
  values: SaleFormValues
  exchangeRate: number
  exchangeRateId: string | null
  saleTotal: number
  existingPaymentById: Map<string, SalePayment>
  removedPaymentIds: string[]
  canManageExistingPayments: boolean
  canAddPaymentLines: boolean
  canDeleteExistingPayments: boolean
  correctionReason: string
  deletionReason: string
  newPaymentMode?: 'clampToRemaining' | 'entered'
}

interface SalePaymentChangePayloads {
  paymentCorrections: SalePaymentCorrectionLinePayload[]
  paymentDeletions: SalePaymentDeletionLinePayload[]
  payments: SalePaymentLinePayload[]
}

interface EmptySaleFormValuesOptions {
  type?: SaleFormInput['type']
  directPaymentEnabled?: boolean
  cashRegisterSessionId?: string
}

interface SaleFormValuesFromSaleOptions {
  emptyType?: SaleFormInput['type']
  forceType?: SaleFormInput['type']
  directPaymentEnabled?: (sale: Sale, completedPaymentCount: number) => boolean
}

export function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

export function round(value: number) {
  return Math.round(value * 100) / 100
}

export function createClientRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10)
}

export function saleItemName(item: SaleItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

export function emptySaleFormValues({
  type = 'invoice',
  directPaymentEnabled = false,
  cashRegisterSessionId = '',
}: EmptySaleFormValuesOptions = {}): SaleFormInput {
  return {
    branch_id: '',
    warehouse_id: '',
    customer_id: '',
    cash_register_session_id: cashRegisterSessionId,
    type,
    sale_date: todayDateString(),
    due_date: '',
    price_group_id: '',
    discount_type: null,
    discount_amount: 0,
    tax_scope: 'line',
    tax_rate_id: '',
    tax_rate_type: null,
    tax_rate: 0,
    tax_type: 'exclusive',
    shipping_charges: 0,
    direct_payment_enabled: directPaymentEnabled,
    direct_payments: [newDirectPaymentLine()],
    notes: '',
    staff_note: '',
    items: [],
  }
}

export function newDirectPaymentLine(paymentAccounts: PaymentAccount[] = []): DirectPaymentLineInput {
  return {
    payment_account_id: paymentAccounts.find((account) => account.is_active)?.id ?? paymentAccounts[0]?.id ?? '',
    payment_currency: 'USD',
    payment_amount: 0,
    method: 'cash',
    reference: '',
  }
}

export function paymentToDirectPaymentLine(payment: SalePayment): DirectPaymentLineInput {
  return {
    sale_payment_id: payment.id,
    payment_account_id: payment.payment_account_id,
    payment_currency: payment.payment_currency ?? 'USD',
    payment_amount: toNumber(payment.payment_amount ?? payment.amount),
    method: payment.method ?? 'cash',
    reference: payment.reference ?? '',
  }
}

export function saleFormValuesFromSale(
  sale: Sale | null | undefined,
  {
    emptyType = 'invoice',
    forceType,
    directPaymentEnabled,
  }: SaleFormValuesFromSaleOptions = {},
): SaleFormInput {
  if (!sale) return emptySaleFormValues({ type: emptyType })

  const completedPayments = (sale.payments ?? []).filter((payment) => payment.status === 'completed')
  const saleType = ['invoice', 'pos_sale', 'draft', 'suspended', 'quotation'].includes(sale.type)
    ? sale.type as SaleFormInput['type']
    : emptyType

  return {
    branch_id: sale.branch_id,
    warehouse_id: sale.warehouse_id,
    customer_id: sale.customer_id ?? '',
    cash_register_session_id: sale.cash_register_session_id ?? '',
    type: forceType ?? saleType,
    sale_date: sale.sale_date ?? todayDateString(),
    due_date: sale.due_date ?? '',
    price_group_id: sale.price_group?.id ?? '',
    discount_type: sale.discount_type === 'fixed' || sale.discount_type === 'percentage' ? sale.discount_type : null,
    discount_amount: toNumber(sale.discount_amount),
    tax_scope: sale.tax_scope === 'sale' ? 'sale' : 'line',
    tax_rate_id: sale.tax_rate_id ?? '',
    tax_rate_type: sale.tax_rate_type === 'fixed' || sale.tax_rate_type === 'percentage' ? sale.tax_rate_type : null,
    tax_rate: toNumber(sale.tax_rate),
    tax_type: sale.tax_type === 'inclusive' ? 'inclusive' : 'exclusive',
    shipping_charges: toNumber(sale.shipping_charges),
    direct_payment_enabled: directPaymentEnabled
      ? directPaymentEnabled(sale, completedPayments.length)
      : completedPayments.length > 0,
    direct_payments: completedPayments.length > 0
      ? completedPayments.map(paymentToDirectPaymentLine)
      : [newDirectPaymentLine()],
    notes: sale.notes ?? '',
    staff_note: sale.staff_note ?? '',
    items: (sale.items ?? []).map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      sub_unit_id: item.sub_unit_id ?? null,
      unit_id: item.product?.unit?.id ?? null,
      sub_unit_label: item.sub_unit?.short_name ?? item.product?.sub_unit?.short_name ?? item.variation?.sub_unit?.short_name ?? null,
      _base_unit_label: item.product?.unit?.short_name ?? null,
      _sub_unit_option_id: item.product?.sub_unit?.id ?? item.variation?.sub_unit?.id ?? null,
      _base_unit_price: toNumber(item.variation?.selling_price ?? item.product?.selling_price),
      _sub_unit_price: toNumber(item.variation?.sub_unit_selling_price ?? item.product?.sub_unit_selling_price ?? item.variation?.selling_price ?? item.product?.selling_price),
      _conversion_factor: item.sub_unit?.conversion_factor ?? null,
      lot_id: item.lots?.[0]?.lot_id ?? null,
      serial_id: item.serials?.[0]?.serial_id ?? null,
      stock_tracking: item.product?.stock_tracking ?? null,
      product_label: saleItemName(item),
      sku: item.variation?.sku ?? item.product?.sku ?? null,
      lot_number: item.lots?.[0]?.lot?.lot_number ?? null,
      serial_number: item.serials?.[0]?.serial?.serial_number ?? null,
      unit_label: item.sub_unit?.short_name ?? item.product?.unit?.short_name ?? null,
      available_quantity: item.available_quantity ?? null,
      quantity: toNumber(item.quantity, 1),
      unit_price: toNumber(item.unit_price),
      discount_type: item.discount_type === 'fixed' || item.discount_type === 'percentage' ? item.discount_type : null,
      discount_amount: toNumber(item.discount_amount),
      tax_rate_id: item.tax_rate_id ?? '',
      tax_rate_type: item.tax_rate_type === 'fixed' || item.tax_rate_type === 'percentage' ? item.tax_rate_type : null,
      tax_rate: toNumber(item.tax_rate),
      tax_type: item.tax_type === 'inclusive' ? 'inclusive' : 'exclusive',
      unit_cost: toNumber(item.unit_cost),
      notes: item.notes ?? '',
    })),
  }
}

export function discountAmount(type: string | null | undefined, amount: unknown, base: number) {
  const value = toNumber(amount)
  if (type === 'percentage') return Math.min(base, round(base * value / 100))
  if (type === 'fixed') return Math.min(base, value)
  return 0
}

export function taxAmount(type: string | null | undefined, rateType: string | null | undefined, rate: unknown, base: number) {
  const value = toNumber(rate)
  if (!type || !rateType || value <= 0) return { base, tax: 0, total: base }
  const tax = rateType === 'fixed' ? value : round(base * value / 100)

  if (type === 'inclusive') {
    const inclusiveTax = rateType === 'fixed' ? Math.min(base, value) : round(base - (base / (1 + value / 100)))
    return { base: round(base - inclusiveTax), tax: inclusiveTax, total: base }
  }

  return { base, tax, total: round(base + tax) }
}

export function lineTotal(item: Partial<SaleFormInput['items'][number]> | null | undefined, taxScope: string) {
  if (!item) return 0

  const gross = round(toNumber(item.quantity) * toNumber(item.unit_price))
  const afterDiscount = Math.max(0, round(gross - discountAmount(item.discount_type, item.discount_amount, gross)))
  return taxScope === 'line'
    ? taxAmount(item.tax_type, item.tax_rate_type, item.tax_rate, afterDiscount).total
    : afterDiscount
}

export function directPaymentLineBaseAmount(
  line: Partial<DirectPaymentLineInput> | null | undefined,
  exchangeRate: number,
) {
  const amount = round(toNumber(line?.payment_amount))

  if (line?.payment_currency === 'KHR') {
    return exchangeRate > 0 ? round(amount / exchangeRate) : 0
  }

  return amount
}

export function formatUsdKhrAmount(amount: number, exchangeRate: number) {
  const usd = amount.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })

  return {
    usd: `USD: ${usd}`,
    khr: exchangeRate > 0 ? `KHR: ${Math.round(amount * exchangeRate).toLocaleString()}` : 'KHR: -',
  }
}

export function directPaymentLinePayload(
  line: Partial<DirectPaymentLineInput> | null | undefined,
  paymentDate: string,
  exchangeRate: number,
  exchangeRateId: string | null,
): SalePaymentLinePayload | null {
  const paymentAccountId = line?.payment_account_id
  const paymentCurrency = line?.payment_currency ?? 'USD'
  const paymentMethod = line?.method ?? 'cash'
  const lineBaseAmount = directPaymentLineBaseAmount(line, exchangeRate)

  if (!paymentAccountId || lineBaseAmount <= 0) return null

  return {
    payment_account_id: paymentAccountId,
    amount: lineBaseAmount,
    payment_currency: paymentCurrency,
    payment_amount: paymentCurrency === 'KHR' ? round(toNumber(line?.payment_amount)) : lineBaseAmount,
    exchange_rate_id: paymentCurrency === 'KHR' ? exchangeRateId : null,
    method: paymentMethod,
    reference: line?.reference || null,
    payment_date: paymentDate,
    note: null,
  }
}

export function directPaymentLineChanged(line: Partial<DirectPaymentLineInput>, payment: SalePayment) {
  return line.payment_account_id !== payment.payment_account_id
    || (line.payment_currency ?? 'USD') !== (payment.payment_currency ?? 'USD')
    || round(toNumber(line.payment_amount)) !== round(toNumber(payment.payment_amount ?? payment.amount))
    || (line.method ?? 'cash') !== payment.method
    || (line.reference ?? '') !== (payment.reference ?? '')
}

export function buildDirectPaymentLines(values: SaleFormValues, exchangeRate: number, exchangeRateId: string | null, saleTotal: number) {
  let remaining = round(saleTotal)

  return (values.direct_payments ?? []).flatMap((line) => {
    if (line.sale_payment_id) {
      remaining = Math.max(0, round(remaining - directPaymentLineBaseAmount(line, exchangeRate)))
      return []
    }

    if (remaining <= 0) return []

    const payload = directPaymentLinePayload(line, values.sale_date, exchangeRate, exchangeRateId)
    if (!payload) return []

    const appliedAmount = Math.min(payload.amount, remaining)
    remaining = round(remaining - appliedAmount)

    return [{
      ...payload,
      amount: appliedAmount,
      payment_amount: payload.payment_currency === 'KHR'
        ? round(appliedAmount * exchangeRate)
        : appliedAmount,
    }]
  })
}

export function buildSalePaymentChangePayloads({
  values,
  exchangeRate,
  exchangeRateId,
  saleTotal,
  existingPaymentById,
  removedPaymentIds,
  canManageExistingPayments,
  canAddPaymentLines,
  canDeleteExistingPayments,
  correctionReason,
  deletionReason,
  newPaymentMode = 'clampToRemaining',
}: BuildSalePaymentChangePayloadsOptions): SalePaymentChangePayloads {
  const paymentCorrections = canManageExistingPayments
    ? (values.direct_payments ?? []).flatMap((line) => {
      if (!line.sale_payment_id) return []
      if (removedPaymentIds.includes(line.sale_payment_id)) return []

      const payment = existingPaymentById.get(line.sale_payment_id)
      const payload = directPaymentLinePayload(
        line,
        payment?.payment_date ?? values.sale_date,
        exchangeRate,
        exchangeRateId,
      )

      if (!payment || !payload || !directPaymentLineChanged(line, payment)) return []

      return [{
        paymentId: payment.id,
        previousAmount: toNumber(payment.amount),
        nextAmount: payload.amount,
        payload: {
          ...payload,
          payment_date: payment.payment_date ?? values.sale_date,
          note: payment.note ?? null,
          reason: correctionReason,
        },
      }]
    }).sort((a, b) => (a.nextAmount - a.previousAmount) - (b.nextAmount - b.previousAmount))
      .map((paymentLine) => ({
        payment_id: paymentLine.paymentId,
        ...paymentLine.payload,
      }))
    : []

  const payments = canAddPaymentLines
    ? newPaymentMode === 'entered'
      ? (values.direct_payments ?? []).flatMap((line) => {
        if (line.sale_payment_id) return []
        const payload = directPaymentLinePayload(line, values.sale_date, exchangeRate, exchangeRateId)
        return payload ? [payload] : []
      })
      : buildDirectPaymentLines(values, exchangeRate, exchangeRateId, saleTotal)
    : []

  const paymentDeletions = canDeleteExistingPayments
    ? removedPaymentIds
      .filter((paymentId) => existingPaymentById.has(paymentId))
      .map((paymentId) => ({ payment_id: paymentId, reason: deletionReason }))
    : []

  return {
    paymentCorrections,
    paymentDeletions,
    payments,
  }
}

export function buildSalePayload(values: SaleFormValues): SalePayload {
  return {
    branch_id: values.branch_id,
    warehouse_id: values.warehouse_id,
    customer_id: values.customer_id || null,
    cash_register_session_id: values.cash_register_session_id || null,
    type: values.type,
    sale_date: values.sale_date,
    due_date: values.due_date || null,
    price_group_id: values.price_group_id || null,
    discount_type: values.discount_type ?? null,
    discount_amount: values.discount_amount ?? 0,
    tax_scope: values.tax_scope,
    tax_rate_id: values.tax_scope === 'sale' ? values.tax_rate_id || null : null,
    tax_rate_type: values.tax_scope === 'sale' ? values.tax_rate_type ?? null : null,
    tax_rate: values.tax_scope === 'sale' ? values.tax_rate ?? 0 : null,
    tax_type: values.tax_scope === 'sale' ? values.tax_type ?? 'exclusive' : null,
    shipping_charges: values.shipping_charges ?? 0,
    notes: values.notes ?? null,
    staff_note: values.staff_note ?? null,
    items: values.items.map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      sub_unit_id: item.sub_unit_id ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_type: item.discount_type ?? null,
      discount_amount: item.discount_amount ?? 0,
      tax_rate_id: values.tax_scope === 'line' ? item.tax_rate_id || null : null,
      tax_rate_type: values.tax_scope === 'line' ? item.tax_rate_type ?? null : null,
      tax_rate: values.tax_scope === 'line' ? item.tax_rate ?? 0 : null,
      tax_type: values.tax_scope === 'line' ? item.tax_type ?? 'exclusive' : null,
      unit_cost: item.unit_cost ?? 0,
      notes: item.notes ?? null,
      lot_allocations: item.lot_id ? [{ lot_id: item.lot_id, quantity: item.sub_unit_id ? round(item.quantity * toNumber(item._conversion_factor, 1)) : item.quantity }] : undefined,
      serial_ids: item.serial_id ? [item.serial_id] : undefined,
    })),
  }
}
