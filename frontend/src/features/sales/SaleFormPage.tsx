'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import { Add, ArrowBack, DangerCircleOutlined, DeleteOutlined, EditOutlined, SaveOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { useDefaultExchangeRateQuery, usePaymentAccountsQuery } from '@/features/accounting/hooks'
import { useCustomersQuery } from '@/features/customers/hooks'
import { InventoryProductLookupPicker } from '@/features/inventory/components/InventoryProductLookupPicker'
import { usePriceGroupsQuery } from '@/features/price-groups/hooks'
import { useAppCurrency, useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useTaxRatesQuery } from '@/features/tax-rates/hooks'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { useAuthStore } from '@/stores/authStore'
import { useCompleteSaleMutation, useCreateSaleMutation, useRecordSalePaymentMutation, useSaleQuery, useUpdateSaleMutation, useUpdateSalePaymentMutation } from './hooks'
import { saleFormSchema, type SaleFormInput, type SaleFormValues } from './schema'
import { SalePaymentCorrectionDialog } from './SalePaymentCorrectionDialog'
import { formatAppDate } from '@/utils/dateFormat'
import type { PaymentAccount } from '@/types/accounting'
import type { InventoryProductLookupItem } from '@/types/inventory'
import type { Sale, SaleItem, SalePayload, SalePayment, SalePaymentCorrectionPayload } from '@/types/sales'
import type { Warehouse } from '@/types/warehouse'
import type { Customer } from '@/types/customer'
import type { PriceGroup } from '@/types/priceGroup'
import type { TaxRate } from '@/types/taxRate'

interface SaleFormPageProps {
  saleId?: string
}

const itemColumnSx = {
  product: { width: 340, minWidth: 340 },
  quantity: { width: 130, minWidth: 130 },
  price: { width: 150, minWidth: 150 },
  discountType: { width: 150, minWidth: 150 },
  discount: { width: 130, minWidth: 130 },
  tax: { width: 150, minWidth: 150 },
  notes: { width: 220, minWidth: 220 },
  total: { width: 140, minWidth: 140 },
  actions: { width: 80, minWidth: 80 },
} as const

const directPaymentColumnSx = {
  account: { width: 260, minWidth: 260 },
  currency: { width: 120, minWidth: 120 },
  amount: { width: 180, minWidth: 180 },
  method: { width: 180, minWidth: 180 },
  reference: { width: 220, minWidth: 220 },
  converted: { width: 160, minWidth: 160 },
  actions: { width: 72, minWidth: 72 },
} as const

const saleTypes = ['invoice', 'pos_sale', 'draft', 'suspended', 'quotation'] as const
const discountTypes = ['fixed', 'percentage'] as const
const taxScopes = ['line', 'sale'] as const
const taxTypes = ['exclusive', 'inclusive'] as const
const paymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other'] as const

function today() {
  return dayjs().format('YYYY-MM-DD')
}

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function emptyValues(): SaleFormInput {
  return {
    branch_id: '',
    warehouse_id: '',
    customer_id: '',
    type: 'invoice',
    sale_date: today(),
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
    direct_payment_enabled: false,
    direct_payments: [newDirectPaymentLine()],
    notes: '',
    staff_note: '',
    items: [],
  }
}

function itemName(item: SaleItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function warehouseLabel(warehouse: Warehouse) {
  return [warehouse.name, warehouse.code, warehouse.branch?.name].filter(Boolean).join(' / ')
}

function customerLabel(customer: Customer) {
  return [customer.name, customer.code, customer.phone || customer.mobile].filter(Boolean).join(' / ')
}

function priceGroupLabel(group: PriceGroup) {
  return group.name
}

function taxRateLabel(rate: TaxRate) {
  return `${rate.name} (${rate.rate}${rate.type === 'percentage' ? '%' : ''})`
}

function paymentAccountLabel(account: PaymentAccount) {
  return [account.name, account.type].filter(Boolean).join(' / ')
}

function salePaymentAccountLabel(payment: SalePayment) {
  return payment.payment_account
    ? [payment.payment_account.name, payment.payment_account.type].filter(Boolean).join(' / ')
    : payment.payment_account_id
}

function paymentEnteredAmount(payment: SalePayment) {
  if (payment.payment_currency === 'KHR' && payment.payment_amount) {
    return `KHR ${Number(payment.payment_amount).toLocaleString()}`
  }

  return `USD ${Number(payment.payment_amount ?? payment.amount ?? 0).toFixed(2)}`
}

function valuesFromSale(sale: Sale | null | undefined): SaleFormInput {
  if (!sale) return emptyValues()

  return {
    branch_id: sale.branch_id,
    warehouse_id: sale.warehouse_id,
    customer_id: sale.customer_id ?? '',
    type: ['invoice', 'pos_sale', 'draft', 'suspended', 'quotation'].includes(sale.type) ? sale.type as SaleFormInput['type'] : 'invoice',
    sale_date: sale.sale_date ?? today(),
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
    direct_payment_enabled: false,
    direct_payments: [newDirectPaymentLine()],
    notes: sale.notes ?? '',
    staff_note: sale.staff_note ?? '',
    items: (sale.items ?? []).map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      sub_unit_id: item.sub_unit_id ?? null,
      lot_id: item.lots?.[0]?.lot_id ?? null,
      serial_id: item.serials?.[0]?.serial_id ?? null,
      product_label: itemName(item),
      sku: item.variation?.sku ?? item.product?.sku ?? null,
      lot_number: item.lots?.[0]?.lot?.lot_number ?? null,
      serial_number: item.serials?.[0]?.serial?.serial_number ?? null,
      unit_label: item.sub_unit?.short_name ?? item.product?.unit?.short_name ?? null,
      available_quantity: null,
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

function discountAmount(type: string | null | undefined, amount: unknown, base: number) {
  const value = toNumber(amount)
  if (type === 'percentage') return Math.min(base, round(base * value / 100))
  if (type === 'fixed') return Math.min(base, value)
  return 0
}

function taxAmount(type: string | null | undefined, rateType: string | null | undefined, rate: unknown, base: number) {
  const value = toNumber(rate)
  if (!type || !rateType || value <= 0) return { base, tax: 0, total: base }
  const tax = rateType === 'fixed' ? value : round(base * value / 100)

  if (type === 'inclusive') {
    const inclusiveTax = rateType === 'fixed' ? Math.min(base, value) : round(base - (base / (1 + value / 100)))
    return { base: round(base - inclusiveTax), tax: inclusiveTax, total: base }
  }

  return { base, tax, total: round(base + tax) }
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

type DirectPaymentLineInput = NonNullable<SaleFormInput['direct_payments']>[number]

function newDirectPaymentLine(paymentAccounts: PaymentAccount[] = []): DirectPaymentLineInput {
  return {
    payment_account_id: paymentAccounts.find((account) => account.is_active)?.id ?? '',
    payment_currency: 'USD',
    payment_amount: 0,
    method: 'cash',
    reference: '',
  }
}

function directPaymentLineBaseAmount(
  line: Partial<DirectPaymentLineInput> | null | undefined,
  exchangeRate: number,
) {
  const amount = round(toNumber(line?.payment_amount))

  if (line?.payment_currency === 'KHR') {
    return exchangeRate > 0 ? round(amount / exchangeRate) : 0
  }

  return amount
}

function buildDirectPaymentLines(values: SaleFormValues, exchangeRate: number, exchangeRateId: string | null, saleTotal: number) {
  let remaining = round(saleTotal)

  return (values.direct_payments ?? []).flatMap((line) => {
    if (remaining <= 0) return []

    const paymentAccountId = line.payment_account_id
    const paymentCurrency = line.payment_currency ?? 'USD'
    const paymentMethod = line.method ?? 'cash'

    if (!paymentAccountId) return []

    const lineBaseAmount = directPaymentLineBaseAmount(line, exchangeRate)
    if (lineBaseAmount <= 0) return []

    const appliedAmount = Math.min(lineBaseAmount, remaining)
    remaining = round(remaining - appliedAmount)

    return [{
      payment_account_id: paymentAccountId,
      amount: appliedAmount,
      payment_currency: paymentCurrency,
      payment_amount: paymentCurrency === 'KHR'
        ? round(appliedAmount * exchangeRate)
        : appliedAmount,
      exchange_rate_id: paymentCurrency === 'KHR' ? exchangeRateId : null,
      method: paymentMethod,
      reference: line.reference || null,
      payment_date: values.sale_date,
      note: null,
    }]
  })
}

function outstandingAmount(sale: Sale | null | undefined, fallbackTotal: number) {
  const total = toNumber(sale?.total_amount, fallbackTotal)
  const paid = toNumber(sale?.paid_amount)

  return Math.max(0, round(total - paid))
}

function formatUsdKhrAmount(amount: number, exchangeRate: number) {
  const usd = `USD ${amount.toFixed(2)}`
  const khr = exchangeRate > 0
    ? `KHR ${Math.round(amount * exchangeRate).toLocaleString()}`
    : 'KHR -'

  return { usd, khr }
}

function InstructionTooltip({ title }: { title: string }) {
  return (
    <Tooltip title={title}>
      <IconButton size="small" color="warning" sx={{ ml: 0.5 }} aria-label={title}>
        <DangerCircleOutlined fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}

function lineTotal(item: Partial<SaleFormInput['items'][number]> | null | undefined, taxScope: string) {
  if (!item) return 0

  const gross = round(toNumber(item.quantity) * toNumber(item.unit_price))
  const afterDiscount = Math.max(0, round(gross - discountAmount(item.discount_type, item.discount_amount, gross)))
  return taxScope === 'line'
    ? taxAmount(item.tax_type, item.tax_rate_type, item.tax_rate, afterDiscount).total
    : afterDiscount
}

function buildPayload(values: SaleFormValues): SalePayload {
  return {
    branch_id: values.branch_id,
    warehouse_id: values.warehouse_id,
    customer_id: values.customer_id || null,
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
      lot_allocations: item.lot_id ? [{ lot_id: item.lot_id, quantity: item.quantity }] : undefined,
      serial_ids: item.serial_id ? [item.serial_id] : undefined,
    })),
  }
}

export function SaleFormPage({ saleId }: SaleFormPageProps) {
  const { t, i18n } = useTranslation(['sales', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [serverError, setServerError] = useState('')
  const [editingPayment, setEditingPayment] = useState<SalePayment | null>(null)
  const isEdit = !!saleId
  const currency = useAppCurrency()
  const currencyFormatter = useCurrencyFormatter()
  const dateFormat = useAppDateFormat()

  const saleQuery = useSaleQuery(saleId ?? null)
  const customersQuery = useCustomersQuery({ status: 'active', per_page: 100 })
  const priceGroupsQuery = usePriceGroupsQuery({ per_page: 100 })
  const taxRatesQuery = useTaxRatesQuery({ is_active: true, per_page: 100 })
  const createSale = useCreateSaleMutation()
  const updateSale = useUpdateSaleMutation()
  const completeSale = useCompleteSaleMutation()
  const recordPayment = useRecordSalePaymentMutation()
  const updatePayment = useUpdateSalePaymentMutation()
  const isSaving = createSale.isPending || updateSale.isPending || completeSale.isPending || recordPayment.isPending || updatePayment.isPending

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<SaleFormInput, unknown, SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: emptyValues(),
  })

  const { fields: itemFields, append, remove } = useFieldArray({ control, name: 'items', keyName: 'fieldId' })
  const {
    fields: directPaymentFields,
    append: appendDirectPayment,
    remove: removeDirectPayment,
  } = useFieldArray({ control, name: 'direct_payments', keyName: 'fieldId' })
  const branchId = useWatch({ control, name: 'branch_id' })
  const warehouseId = useWatch({ control, name: 'warehouse_id' })
  const taxScope = useWatch({ control, name: 'tax_scope' })
  const watchedItemsValue = useWatch({ control, name: 'items' })
  const watchedItems = useMemo(() => watchedItemsValue ?? [], [watchedItemsValue])
  const saleDiscountType = useWatch({ control, name: 'discount_type' })
  const saleDiscountValue = useWatch({ control, name: 'discount_amount' })
  const saleTaxType = useWatch({ control, name: 'tax_type' })
  const saleTaxRateType = useWatch({ control, name: 'tax_rate_type' })
  const saleTaxRate = useWatch({ control, name: 'tax_rate' })
  const shippingCharges = useWatch({ control, name: 'shipping_charges' })
  const saleType = useWatch({ control, name: 'type' })
  const directPaymentEnabled = useWatch({ control, name: 'direct_payment_enabled' })
  const watchedDirectPaymentsValue = useWatch({ control, name: 'direct_payments' })
  const watchedDirectPayments = useMemo(() => watchedDirectPaymentsValue ?? [], [watchedDirectPaymentsValue])
  const warehousesQuery = useWarehousesQuery({ per_page: 100 })
  const paymentAccountsQuery = usePaymentAccountsQuery({ status: 'active', per_page: 100 })
  const defaultExchangeRateQuery = useDefaultExchangeRateQuery('USD', 'KHR')

  const warehouses = useMemo(() => warehousesQuery.data?.data ?? [], [warehousesQuery.data?.data])
  const customers = customersQuery.data?.data ?? []
  const priceGroups = priceGroupsQuery.data?.data ?? []
  const taxRates = taxRatesQuery.data?.data ?? []
  const paymentAccounts = useMemo(
    () => (paymentAccountsQuery.data?.data ?? []).filter((account) => account.is_active),
    [paymentAccountsQuery.data?.data],
  )
  const defaultExchangeRate = defaultExchangeRateQuery.data ?? null
  const defaultExchangeRateValue = toNumber(defaultExchangeRate?.rate)

  const totals = useMemo(() => {
    const subtotal = round(watchedItems.reduce((sum, item) => sum + lineTotal(item, taxScope), 0))
    const saleDiscount = discountAmount(saleDiscountType, saleDiscountValue, subtotal)
    const discounted = Math.max(0, round(subtotal - saleDiscount))
    const saleTax = taxScope === 'sale'
      ? taxAmount(saleTaxType, saleTaxRateType, saleTaxRate, discounted).tax
      : 0

    return {
      subtotal,
      discount: saleDiscount,
      tax: saleTax,
      shipping: toNumber(shippingCharges),
      total: round(discounted + saleTax + toNumber(shippingCharges)),
    }
  }, [saleDiscountType, saleDiscountValue, saleTaxRate, saleTaxRateType, saleTaxType, shippingCharges, taxScope, watchedItems])
  const directPaymentBase = round(
    watchedDirectPayments.reduce((total, line) => total + directPaymentLineBaseAmount(line, defaultExchangeRateValue), 0),
  )
  const directPaymentBaseDisplay = formatUsdKhrAmount(directPaymentBase, defaultExchangeRateValue)
  const currentSale = saleQuery.data ?? null
  const currentSaleStatus = currentSale?.status
  const existingPayments = currentSale?.payments ?? []
  const canEditExistingPayments = isEdit && can('payments.edit') && currentSaleStatus === 'completed'
  const editPaymentLimit = isEdit
    ? Math.max(0, round(totals.total - toNumber(currentSale?.paid_amount)))
    : totals.total
  const canTakeDirectPayment = (saleType === 'invoice' || saleType === 'pos_sale')
    && (!isEdit || (
      editPaymentLimit > 0
      && ['draft', 'suspended', 'confirmed', 'completed'].includes(String(currentSaleStatus ?? ''))
    ))
  const directPaymentRemaining = Math.max(0, round(editPaymentLimit - directPaymentBase))
  const directPaymentChange = Math.max(0, round(directPaymentBase - editPaymentLimit))
  const directPaymentRemainingDisplay = formatUsdKhrAmount(directPaymentRemaining, defaultExchangeRateValue)
  const directPaymentChangeDisplay = formatUsdKhrAmount(directPaymentChange, defaultExchangeRateValue)
  const showPaymentSection = canTakeDirectPayment || (isEdit && existingPayments.length > 0)

  useEffect(() => {
    if (saleQuery.data) reset(valuesFromSale(saleQuery.data))
  }, [reset, saleQuery.data])

  useEffect(() => {
    const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId)
    const nextBranchId = selectedWarehouse?.branch_id ?? ''

    if (warehouseId && nextBranchId && branchId !== nextBranchId) {
      setValue('branch_id', nextBranchId, { shouldDirty: true, shouldValidate: true })
    }
  }, [branchId, setValue, warehouseId, warehouses])

  useEffect(() => {
    if (!canTakeDirectPayment && directPaymentEnabled) {
      setValue('direct_payment_enabled', false, { shouldDirty: true, shouldValidate: true })
    }
  }, [canTakeDirectPayment, directPaymentEnabled, setValue])

  useEffect(() => {
    if (!directPaymentEnabled || paymentAccounts.length === 0) return

    watchedDirectPayments.forEach((line, index) => {
      if (!line?.payment_account_id) {
        setValue(`direct_payments.${index}.payment_account_id`, paymentAccounts[0].id, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
    })
  }, [directPaymentEnabled, paymentAccounts, setValue, watchedDirectPayments])

  useEffect(() => {
    if (!defaultExchangeRate) {
      watchedDirectPayments.forEach((line, index) => {
        if (line?.payment_currency === 'KHR') {
          setValue(`direct_payments.${index}.payment_currency`, 'USD', {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      })
    }
  }, [defaultExchangeRate, setValue, watchedDirectPayments])

  const changeDirectPaymentCurrency = (index: number, nextCurrency: 'USD' | 'KHR') => {
    const currentBaseAmount = directPaymentLineBaseAmount(watchedDirectPayments[index], defaultExchangeRateValue)
    const nextPaymentAmount = nextCurrency === 'KHR' && defaultExchangeRateValue > 0
      ? round(currentBaseAmount * defaultExchangeRateValue)
      : currentBaseAmount

    setValue(`direct_payments.${index}.payment_currency`, nextCurrency, { shouldDirty: true, shouldValidate: true })
    setValue(`direct_payments.${index}.payment_amount`, nextPaymentAmount, { shouldDirty: true, shouldValidate: true })
  }

  const addLookupItem = (item: InventoryProductLookupItem) => {
    append({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      sub_unit_id: item.sub_unit?.id ?? null,
      lot_id: item.lot_id ?? null,
      serial_id: item.serial_id ?? null,
      product_label: item.label,
      sku: item.sku ?? null,
      lot_number: item.lot_number ?? null,
      serial_number: item.serial_number ?? null,
      unit_label: item.sub_unit?.short_name ?? item.unit?.short_name ?? null,
      available_quantity: item.available_quantity ?? null,
      quantity: item.serial_id ? 1 : 1,
      unit_price: toNumber(item.selling_price),
      discount_type: null,
      discount_amount: 0,
      tax_rate_id: '',
      tax_rate_type: null,
      tax_rate: 0,
      tax_type: 'exclusive',
      unit_cost: toNumber(item.unit_cost),
      notes: '',
    })
  }

  const applyTaxRate = (index: number, taxRateId: string) => {
    const taxRate = taxRates.find((item) => item.id === taxRateId)
    setValue(`items.${index}.tax_rate_id`, taxRateId)
    setValue(`items.${index}.tax_rate_type`, taxRate?.type ?? null)
    setValue(`items.${index}.tax_rate`, taxRate?.rate ?? 0)
  }

  const submitForm = async (values: SaleFormValues) => {
    setServerError('')

    try {
      if (saleId) {
        const shouldRecordDirectPayment = values.direct_payment_enabled && canTakeDirectPayment
        const sale = await updateSale.mutateAsync({ id: saleId, payload: buildPayload(values) })
        const payableSale = shouldRecordDirectPayment && sale.status !== 'completed'
          ? await completeSale.mutateAsync(sale.id)
          : sale
        const directPaymentLines = shouldRecordDirectPayment
          ? buildDirectPaymentLines(
            values,
            defaultExchangeRateValue,
            defaultExchangeRate?.id ?? null,
            outstandingAmount(payableSale, totals.total),
          )
          : []

        if (shouldRecordDirectPayment && directPaymentLines.length > 0) {
          await recordPayment.mutateAsync({
            id: payableSale.id,
            payload: {
              payment_date: values.sale_date,
              note: null,
              payments: directPaymentLines,
            },
          })
          enqueueSnackbar(t('messages.updatedAndPaid'), { variant: 'success' })
        } else {
          enqueueSnackbar(t('messages.updated'), { variant: 'success' })
        }
        router.push(`/sales/${sale.id}`)
      } else {
        const shouldRecordDirectPayment = values.direct_payment_enabled && canTakeDirectPayment
        const directPaymentLines = shouldRecordDirectPayment
          ? buildDirectPaymentLines(values, defaultExchangeRateValue, defaultExchangeRate?.id ?? null, totals.total)
          : []

        const sale = await createSale.mutateAsync(buildPayload(values))
        if (shouldRecordDirectPayment && directPaymentLines.length > 0) {
          await completeSale.mutateAsync(sale.id)
          await recordPayment.mutateAsync({
            id: sale.id,
            payload: {
              payment_date: values.sale_date,
              note: null,
              payments: directPaymentLines,
            },
          })
          enqueueSnackbar(t('messages.createdAndPaid'), { variant: 'success' })
        } else {
          enqueueSnackbar(t('messages.created'), { variant: 'success' })
        }
        router.push(`/sales/${sale.id}`)
      }
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof SaleFormInput, { type: 'server', message: messages[0] })
        })
      }
      setServerError(apiError.message)
    }
  }

  const submitPaymentCorrection = async (paymentId: string, payload: SalePaymentCorrectionPayload) => {
    if (!saleId) return

    await updatePayment.mutateAsync({
      saleId,
      paymentId,
      payload,
    })

    enqueueSnackbar(t('messages.paymentUpdated'), { variant: 'success' })
  }

  if (isEdit && saleQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography variant="h4">{t(isEdit ? 'form.editTitle' : 'form.createTitle')}</Typography>
            <InstructionTooltip title={t('form.subtitle')} />
          </Stack>
        </Box>
        <Tooltip title={t('actions.backToSales')}>
          <IconButton size="small" aria-label={t('actions.backToSales')} onClick={() => router.push(isEdit && saleId ? `/sales/${saleId}` : '/sales')}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
      </Stack>

      {saleQuery.isError && <Alert severity="error">{toAppApiError(saleQuery.error).message}</Alert>}

      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <Stack spacing={3}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Card>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Stack spacing={2.5}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.3fr) minmax(0, 1fr) 180px 180px' }, gap: 2 }}>
                <Controller
                  name="warehouse_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={warehouses}
                      value={warehouses.find((warehouse) => warehouse.id === field.value) ?? null}
                      loading={warehousesQuery.isLoading}
                      getOptionLabel={warehouseLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onBlur={field.onBlur}
                      onChange={(_, selectedWarehouse) => {
                        field.onChange(selectedWarehouse?.id ?? '')
                        setValue('branch_id', selectedWarehouse?.branch_id ?? '', {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }}
                      renderOption={(props, warehouse) => (
                        <Box component="li" {...props} key={warehouse.id}>
                          <Box>
                            <Typography variant="body2">{warehouse.name}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {[warehouse.code, warehouse.branch?.name].filter(Boolean).join(' / ')}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('fields.warehouse')}
                          error={!!errors.warehouse_id || !!errors.branch_id}
                          helperText={errors.warehouse_id?.message || errors.branch_id?.message}
                          required
                        />
                      )}
                    />
                  )}
                />
                <Controller
                  name="customer_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={customers}
                      value={customers.find((customer) => customer.id === field.value) ?? null}
                      loading={customersQuery.isLoading}
                      getOptionLabel={customerLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onBlur={field.onBlur}
                      onChange={(_, customer) => field.onChange(customer?.id ?? '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('fields.customer')}
                          error={!!errors.customer_id}
                          helperText={errors.customer_id?.message || t('labels.walkInCustomer')}
                        />
                      )}
                    />
                  )}
                />
                <Controller
                  name="sale_date"
                  control={control}
                  render={({ field }) => <AppDatePicker label={t('fields.saleDate')} value={field.value} onChange={(value) => field.onChange(value ?? '')} error={!!errors.sale_date} helperText={errors.sale_date?.message} required />}
                />
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label={t('fields.type')} error={!!errors.type} helperText={errors.type?.message} required>
                      {saleTypes.map((type) => <MenuItem key={type} value={type}>{t(`types.${type}`)}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Controller
                  name="due_date"
                  control={control}
                  render={({ field }) => <AppDatePicker label={t('fields.dueDate')} value={field.value ?? ''} onChange={(value) => field.onChange(value ?? '')} error={!!errors.due_date} helperText={errors.due_date?.message} />}
                />
                <Controller
                  name="price_group_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={priceGroups}
                      value={priceGroups.find((group) => group.id === field.value) ?? null}
                      loading={priceGroupsQuery.isLoading}
                      getOptionLabel={priceGroupLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onBlur={field.onBlur}
                      onChange={(_, group) => field.onChange(group?.id ?? '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('fields.priceGroup')}
                          error={!!errors.price_group_id}
                          helperText={errors.price_group_id?.message || t('form.noPriceGroup')}
                        />
                      )}
                    />
                  )}
                />
              </Box>

              <Stack spacing={1.5}>
                <Box>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Typography variant="subtitle2">{t('form.items')}</Typography>
                    <InstructionTooltip title={t('form.itemsHelp')} />
                  </Stack>
                </Box>
                <InventoryProductLookupPicker
                  warehouseId={warehouseId || undefined}
                  disabled={!warehouseId || isSaving}
                  helperText={undefined}
                  onSelect={addLookupItem}
                />
                <Box sx={{ mt: -1 }}>
                  <InstructionTooltip title={warehouseId ? t('form.pickerHelp') : t('form.selectWarehouseFirst')} />
                </Box>
                {typeof errors.items?.message === 'string' && <Alert severity="error">{errors.items.message}</Alert>}

                <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 1460, tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={itemColumnSx.product}>{t('items.product')}</TableCell>
                        <TableCell sx={itemColumnSx.quantity} align="right">{t('items.quantity')}</TableCell>
                        <TableCell sx={itemColumnSx.price} align="right">{t('items.unitPrice')}</TableCell>
                        <TableCell sx={itemColumnSx.discountType}>{t('items.discountType')}</TableCell>
                        <TableCell sx={itemColumnSx.discount} align="right">{t('items.discount')}</TableCell>
                        <TableCell sx={itemColumnSx.tax}>{t('items.tax')}</TableCell>
                        <TableCell sx={itemColumnSx.notes}>{t('fields.notes')}</TableCell>
                        <TableCell sx={itemColumnSx.total} align="right">{t('items.total')}</TableCell>
                        <TableCell sx={itemColumnSx.actions} align="right">{t('columns.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {itemFields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('form.emptyItems')}</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                      {itemFields.map((field, index) => (
                          <TableRow key={field.fieldId}>
                            <TableCell sx={itemColumnSx.product}>
                              <Stack spacing={0.25}>
                                <Typography variant="body2">{field.product_label || field.product_id}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {[field.sku, field.lot_number, field.serial_number, field.unit_label].filter(Boolean).join(' / ') || '-'}
                                </Typography>
                                {field.available_quantity !== null && field.available_quantity !== undefined && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {t('form.available', { quantity: field.available_quantity })}
                                  </Typography>
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="right" sx={itemColumnSx.quantity}>
                              <Controller name={`items.${index}.quantity`} control={control} render={({ field }) => (
                                <TextField {...field} fullWidth type="number" error={!!errors.items?.[index]?.quantity} helperText={errors.items?.[index]?.quantity?.message} required slotProps={{ htmlInput: { min: 0.0001, step: 0.0001 } }} />
                              )} />
                            </TableCell>
                            <TableCell align="right" sx={itemColumnSx.price}>
                              <Controller name={`items.${index}.unit_price`} control={control} render={({ field }) => (
                                <TextField {...field} fullWidth type="number" error={!!errors.items?.[index]?.unit_price} helperText={errors.items?.[index]?.unit_price?.message} required slotProps={{ htmlInput: { min: 0, step: 0.01 }, input: { startAdornment: <InputAdornment position="start">{currency}</InputAdornment> } }} />
                              )} />
                            </TableCell>
                            <TableCell sx={itemColumnSx.discountType}>
                              <Controller name={`items.${index}.discount_type`} control={control} render={({ field }) => (
                                <TextField {...field} fullWidth value={field.value ?? ''} select error={!!errors.items?.[index]?.discount_type} helperText={errors.items?.[index]?.discount_type?.message}>
                                  <MenuItem value="">{t('form.noDiscount')}</MenuItem>
                                  {discountTypes.map((type) => <MenuItem key={type} value={type}>{t(`discountTypes.${type}`)}</MenuItem>)}
                                </TextField>
                              )} />
                            </TableCell>
                            <TableCell align="right" sx={itemColumnSx.discount}>
                              <Controller name={`items.${index}.discount_amount`} control={control} render={({ field }) => (
                                <TextField {...field} fullWidth value={field.value ?? ''} type="number" error={!!errors.items?.[index]?.discount_amount} helperText={errors.items?.[index]?.discount_amount?.message} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                              )} />
                            </TableCell>
                            <TableCell sx={itemColumnSx.tax}>
                              <Controller name={`items.${index}.tax_rate_id`} control={control} render={({ field }) => (
                                <Autocomplete
                                  fullWidth
                                  options={taxRates}
                                  value={taxRates.find((rate) => rate.id === field.value) ?? null}
                                  loading={taxRatesQuery.isLoading}
                                  getOptionLabel={taxRateLabel}
                                  isOptionEqualToValue={(option, value) => option.id === value.id}
                                  disabled={taxScope !== 'line'}
                                  onBlur={field.onBlur}
                                  onChange={(_, rate) => applyTaxRate(index, rate?.id ?? '')}
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      error={!!errors.items?.[index]?.tax_rate_id}
                                      helperText={errors.items?.[index]?.tax_rate_id?.message}
                                    />
                                  )}
                                />
                              )} />
                            </TableCell>
                            <TableCell sx={itemColumnSx.notes}>
                              <Controller name={`items.${index}.notes`} control={control} render={({ field }) => (
                                <TextField {...field} fullWidth value={field.value ?? ''} error={!!errors.items?.[index]?.notes} helperText={errors.items?.[index]?.notes?.message} />
                              )} />
                            </TableCell>
                            <TableCell align="right" sx={itemColumnSx.total}>{currencyFormatter.format(lineTotal(watchedItems[index] ?? field, taxScope))}</TableCell>
                            <TableCell align="right" sx={itemColumnSx.actions}>
                              <Tooltip title={t('actions.removeItem')}>
                                <span>
                                  <IconButton size="small" color="error" disabled={isSaving} onClick={() => remove(index)}>
                                    <DeleteOutlined />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                <Controller name="discount_type" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} select label={t('fields.discountType')} error={!!errors.discount_type} helperText={errors.discount_type?.message}>
                    <MenuItem value="">{t('form.noDiscount')}</MenuItem>
                    {discountTypes.map((type) => <MenuItem key={type} value={type}>{t(`discountTypes.${type}`)}</MenuItem>)}
                  </TextField>
                )} />
                <Controller name="discount_amount" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} type="number" label={t('fields.discount')} error={!!errors.discount_amount} helperText={errors.discount_amount?.message} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                )} />
                <Controller name="shipping_charges" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} type="number" label={t('fields.shipping')} error={!!errors.shipping_charges} helperText={errors.shipping_charges?.message} slotProps={{ htmlInput: { min: 0, step: 0.01 }, input: { startAdornment: <InputAdornment position="start">{currency}</InputAdornment> } }} />
                )} />
                <FormControl error={!!errors.tax_scope}>
                  <InputLabel id="sale-tax-scope-label">{t('fields.taxScope')}</InputLabel>
                  <Controller name="tax_scope" control={control} render={({ field }) => (
                    <Select {...field} labelId="sale-tax-scope-label" label={t('fields.taxScope')}>
                      {taxScopes.map((scope) => <MenuItem key={scope} value={scope}>{t(`taxScopes.${scope}`)}</MenuItem>)}
                    </Select>
                  )} />
                  <FormHelperText>{errors.tax_scope?.message}</FormHelperText>
                </FormControl>
              </Box>

              {taxScope === 'sale' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <Controller name="tax_rate_id" control={control} render={({ field }) => (
                    <Autocomplete
                      options={taxRates}
                      value={taxRates.find((rate) => rate.id === field.value) ?? null}
                      loading={taxRatesQuery.isLoading}
                      getOptionLabel={taxRateLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onBlur={field.onBlur}
                      onChange={(_, taxRate) => {
                        field.onChange(taxRate?.id ?? '')
                        setValue('tax_rate_type', taxRate?.type ?? null)
                        setValue('tax_rate', taxRate?.rate ?? 0)
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('fields.tax')}
                          error={!!errors.tax_rate_id}
                          helperText={errors.tax_rate_id?.message || t('form.noTax')}
                        />
                      )}
                    />
                  )} />
                  <Controller name="tax_type" control={control} render={({ field }) => (
                    <TextField {...field} value={field.value ?? 'exclusive'} select label={t('fields.taxType')} error={!!errors.tax_type} helperText={errors.tax_type?.message}>
                      {taxTypes.map((type) => <MenuItem key={type} value={type}>{t(`taxTypes.${type}`)}</MenuItem>)}
                    </TextField>
                  )} />
                </Box>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
                {[
                  ['subtotal', totals.subtotal],
                  ['discount', totals.discount],
                  ['tax', totals.tax],
                  ['shipping', totals.shipping],
                  ['total', totals.total],
                ].map(([key, value]) => {
                  const display = formatUsdKhrAmount(Number(value), defaultExchangeRateValue)
                  const isTotal = key === 'total'

                  return (
                    <Box key={key}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t(`fields.${key}`)}</Typography>
                      <Typography variant={isTotal ? 'h6' : 'subtitle1'} sx={{ fontWeight: isTotal ? 800 : 600 }}>
                        {display.usd}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isTotal ? 'text.primary' : 'text.secondary', fontWeight: isTotal ? 700 : 400 }}>
                        {display.khr}
                      </Typography>
                    </Box>
                  )
                })}
              </Box>

              </Stack>
            </CardContent>
          </Card>

          {showPaymentSection && (
            <Card>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Stack spacing={1.5}>
                  {isEdit && (
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2">{t('payment.existingTitle')}</Typography>
                      {existingPayments.length === 0 ? (
                        <Alert severity="info">{t('payment.noRecords')}</Alert>
                      ) : (
                        <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                          <Table sx={{ minWidth: 1080, tableLayout: 'fixed' }}>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ width: 140 }}>{t('payment.date')}</TableCell>
                                <TableCell sx={{ width: 240 }}>{t('payment.account')}</TableCell>
                                <TableCell sx={{ width: 150 }}>{t('payment.method')}</TableCell>
                                <TableCell sx={{ width: 170 }} align="right">{t('payment.amount')}</TableCell>
                                <TableCell sx={{ width: 170 }} align="right">{t('payment.converted')}</TableCell>
                                <TableCell sx={{ width: 160 }}>{t('payment.reference')}</TableCell>
                                <TableCell sx={{ width: 130 }}>{t('payment.status')}</TableCell>
                                <TableCell sx={{ width: 120 }} align="right">{t('columns.actions')}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {existingPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                  <TableCell>{payment.payment_date ? formatAppDate(payment.payment_date, dateFormat, i18n.language) : '-'}</TableCell>
                                  <TableCell>{salePaymentAccountLabel(payment)}</TableCell>
                                  <TableCell>{t(`paymentMethods.${payment.method}`, { defaultValue: payment.method })}</TableCell>
                                  <TableCell align="right">{paymentEnteredAmount(payment)}</TableCell>
                                  <TableCell align="right">{currencyFormatter.format(toNumber(payment.amount))}</TableCell>
                                  <TableCell>{payment.reference || '-'}</TableCell>
                                  <TableCell>{t(`payment.${payment.status}`, { defaultValue: payment.status })}</TableCell>
                                  <TableCell align="right">
                                    {canEditExistingPayments && payment.status === 'completed' ? (
                                          <Tooltip title={t('payment.editAction')}>
                                        <span>
                                          <IconButton size="small" onClick={() => setEditingPayment(payment)} disabled={isSaving}>
                                            <EditOutlined />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    ) : null}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Stack>
                  )}

                  {canTakeDirectPayment && (
                    <>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
                    >
                      <Box>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          <Typography variant="subtitle2">{t('payment.directTitle')}</Typography>
                          <InstructionTooltip title={t('payment.directHelp')} />
                        </Stack>
                      </Box>
                      <Controller
                        name="direct_payment_enabled"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={!!field.value}
                                onChange={(event) => field.onChange(event.target.checked)}
                              />
                            }
                            label={t('payment.takeNow')}
                          />
                        )}
                      />
                    </Stack>

                    {directPaymentEnabled && paymentAccounts.length === 0 && (
                      <Alert severity="warning">{t('payment.noAccounts')}</Alert>
                    )}
                    {directPaymentEnabled && !defaultExchangeRateQuery.isLoading && !defaultExchangeRate && (
                      <Alert severity="info">{t('payment.noExchangeRate')}</Alert>
                    )}

                    {directPaymentEnabled && (
                      <>
                        {typeof errors.direct_payments?.message === 'string' && (
                          <Alert severity="error">{errors.direct_payments.message}</Alert>
                        )}
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1.5}
                          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
                        >
                          <Typography variant="subtitle2">{t('payment.lines')}</Typography>
                          <Button
                            type="button"
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => appendDirectPayment(newDirectPaymentLine(paymentAccounts))}
                            disabled={isSaving || paymentAccounts.length === 0}
                          >
                            {t('payment.addLine')}
                          </Button>
                        </Stack>

                        <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                          <Table sx={{ minWidth: 1214, tableLayout: 'fixed' }}>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={directPaymentColumnSx.account}>{t('payment.account')}</TableCell>
                                <TableCell sx={directPaymentColumnSx.currency}>{t('payment.currency')}</TableCell>
                                <TableCell sx={directPaymentColumnSx.amount} align="right">{t('payment.amount')}</TableCell>
                                <TableCell sx={directPaymentColumnSx.method}>{t('payment.method')}</TableCell>
                                <TableCell sx={directPaymentColumnSx.reference}>{t('payment.reference')}</TableCell>
                                <TableCell sx={directPaymentColumnSx.converted} align="right">{t('payment.converted')}</TableCell>
                                <TableCell sx={directPaymentColumnSx.actions} align="right">{t('columns.actions')}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {directPaymentFields.map((field, index) => (
                                <TableRow key={field.fieldId}>
                                  <TableCell sx={directPaymentColumnSx.account}>
                                    <Controller
                                      name={`direct_payments.${index}.payment_account_id`}
                                      control={control}
                                      render={({ field }) => (
                                        <Autocomplete
                                          fullWidth
                                          options={paymentAccounts}
                                          value={paymentAccounts.find((account) => account.id === field.value) ?? null}
                                          loading={paymentAccountsQuery.isLoading}
                                          getOptionLabel={paymentAccountLabel}
                                          isOptionEqualToValue={(option, value) => option.id === value.id}
                                          onBlur={field.onBlur}
                                          onChange={(_, account) => field.onChange(account?.id ?? '')}
                                          renderInput={(params) => (
                                            <TextField
                                              {...params}
                                              error={!!errors.direct_payments?.[index]?.payment_account_id}
                                              helperText={errors.direct_payments?.[index]?.payment_account_id?.message}
                                              required
                                            />
                                          )}
                                        />
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell sx={directPaymentColumnSx.currency}>
                                    <Controller
                                      name={`direct_payments.${index}.payment_currency`}
                                      control={control}
                                      render={({ field }) => (
                                        <TextField
                                          {...field}
                                          value={field.value ?? 'USD'}
                                          fullWidth
                                          select
                                          error={!!errors.direct_payments?.[index]?.payment_currency}
                                          helperText={errors.direct_payments?.[index]?.payment_currency?.message}
                                          required
                                          onChange={(event) => changeDirectPaymentCurrency(index, event.target.value as 'USD' | 'KHR')}
                                        >
                                          <MenuItem value="USD">USD</MenuItem>
                                          <MenuItem value="KHR" disabled={!defaultExchangeRate}>KHR</MenuItem>
                                        </TextField>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={directPaymentColumnSx.amount}>
                                    <Controller
                                      name={`direct_payments.${index}.payment_amount`}
                                      control={control}
                                      render={({ field }) => (
                                        <TextField
                                          {...field}
                                          value={field.value ?? ''}
                                          fullWidth
                                          type="number"
                                          error={!!errors.direct_payments?.[index]?.payment_amount}
                                          helperText={errors.direct_payments?.[index]?.payment_amount?.message}
                                          required
                                          slotProps={{
                                            htmlInput: { min: 0.01, step: 0.01 },
                                            input: {
                                              startAdornment: <InputAdornment position="start">{watchedDirectPayments[index]?.payment_currency ?? 'USD'}</InputAdornment>,
                                            },
                                          }}
                                        />
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell sx={directPaymentColumnSx.method}>
                                    <Controller
                                      name={`direct_payments.${index}.method`}
                                      control={control}
                                      render={({ field }) => (
                                        <TextField
                                          {...field}
                                          value={field.value ?? 'cash'}
                                          fullWidth
                                          select
                                          error={!!errors.direct_payments?.[index]?.method}
                                          helperText={errors.direct_payments?.[index]?.method?.message}
                                          required
                                        >
                                          {paymentMethods.map((method) => (
                                            <MenuItem key={method} value={method}>
                                              {t(`paymentMethods.${method}`)}
                                            </MenuItem>
                                          ))}
                                        </TextField>
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell sx={directPaymentColumnSx.reference}>
                                    <Controller
                                      name={`direct_payments.${index}.reference`}
                                      control={control}
                                      render={({ field }) => (
                                        <TextField
                                          {...field}
                                          value={field.value ?? ''}
                                          fullWidth
                                          error={!!errors.direct_payments?.[index]?.reference}
                                          helperText={errors.direct_payments?.[index]?.reference?.message}
                                        />
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={directPaymentColumnSx.converted}>
                                    <Typography variant="body2">
                                      {currencyFormatter.format(directPaymentLineBaseAmount(watchedDirectPayments[index], defaultExchangeRateValue))}
                                    </Typography>
                                    {watchedDirectPayments[index]?.payment_currency === 'KHR' && defaultExchangeRate && (
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        1 USD = {Number(defaultExchangeRate.rate ?? 0).toLocaleString()} KHR
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="right" sx={directPaymentColumnSx.actions}>
                                    <Tooltip title={t('payment.removeLine')}>
                                      <span>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          disabled={isSaving || directPaymentFields.length === 1}
                                          onClick={() => removeDirectPayment(index)}
                                        >
                                          <DeleteOutlined />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                            gap: 2,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 2,
                            bgcolor: 'action.hover',
                          }}
                        >
                          {[
                            {
                              label: t('payment.totalEntered'),
                              amount: directPaymentBaseDisplay,
                              color: 'text.primary',
                            },
                            {
                              label: t('payment.remaining'),
                              amount: directPaymentRemainingDisplay,
                              color: 'text.primary',
                            },
                            {
                              label: t('payment.changeBack'),
                              amount: directPaymentChangeDisplay,
                              color: directPaymentChange > 0 ? 'success.main' : 'text.primary',
                            },
                          ].map((item) => (
                            <Box key={item.label}>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {item.label}
                              </Typography>
                              <Typography variant="subtitle2" sx={{ color: item.color }}>
                                {item.amount.usd}
                              </Typography>
                              <Typography variant="body2" sx={{ color: item.color }}>
                                {item.amount.khr}
                              </Typography>
                            </Box>
                          ))}
                        </Box>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'flex-end' }}>
                          <Button
                            type="button"
                            variant="outlined"
                            onClick={() => {
                              const currentLine = watchedDirectPayments[0]
                              const nextCurrency = currentLine?.payment_currency ?? 'USD'
                              const nextAmount = nextCurrency === 'KHR' && defaultExchangeRateValue > 0
                                ? round(editPaymentLimit * defaultExchangeRateValue)
                                : editPaymentLimit

                              setValue('direct_payments', [{
                                ...newDirectPaymentLine(paymentAccounts),
                                payment_account_id: currentLine?.payment_account_id || paymentAccounts[0]?.id || '',
                                payment_currency: nextCurrency,
                                payment_amount: nextAmount,
                                method: currentLine?.method ?? 'cash',
                                reference: currentLine?.reference ?? '',
                              }], { shouldDirty: true, shouldValidate: true })
                            }}
                          >
                            {t(isEdit ? 'payment.useRemaining' : 'payment.useTotal')}
                          </Button>
                        </Stack>
                      </>
                    )}
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Controller name="notes" control={control} render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} label={t('fields.notes')} error={!!errors.notes} helperText={errors.notes?.message} multiline minRows={3} />
            )} />
            <Controller name="staff_note" control={control} render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} label={t('fields.staffNote')} error={!!errors.staff_note} helperText={errors.staff_note?.message} multiline minRows={3} />
            )} />
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => router.push(isEdit && saleId ? `/sales/${saleId}` : '/sales')} disabled={isSaving}>
              {t('common:buttons.cancel')}
            </Button>
            <Button type="submit" variant="contained" startIcon={isSaving ? undefined : <SaveOutlined />} disabled={isSaving}>
              {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
            </Button>
          </Stack>
        </Stack>
      </Box>
      <SalePaymentCorrectionDialog
        open={!!editingPayment}
        payment={editingPayment}
        paymentAccounts={paymentAccounts}
        defaultExchangeRate={defaultExchangeRate}
        isSaving={updatePayment.isPending}
        onClose={() => setEditingPayment(null)}
        onSubmit={(payload) => editingPayment ? submitPaymentCorrection(editingPayment.id, payload) : Promise.resolve()}
      />
    </Stack>
  )
}
