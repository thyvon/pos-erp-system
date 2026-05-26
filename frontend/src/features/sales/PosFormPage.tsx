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
  CardActionArea,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material'
import dayjs from 'dayjs'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { AccountBalanceWalletOutlined, Add, ArrowBack, DeleteOutlined, EditOutlined, PointOfSaleOutlined, SettingsOutlined } from '@/components/ui/icons'
import { useDefaultExchangeRateQuery, usePaymentAccountsQuery } from '@/features/accounting/hooks'
import { useBrandsQuery } from '@/features/brands/hooks'
import { useCategoriesQuery } from '@/features/categories/hooks'
import { useCustomersQuery } from '@/features/customers/hooks'
import { inventoryApi } from '@/features/inventory/api'
import { InventoryProductLookupPicker } from '@/features/inventory/components/InventoryProductLookupPicker'
import { usePriceGroupsQuery } from '@/features/price-groups/hooks'
import { useProductsQuery } from '@/features/products/hooks'
import { useAppCurrency, useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useTaxRatesQuery } from '@/features/tax-rates/hooks'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import type { Brand } from '@/types/brand'
import type { Category } from '@/types/category'
import type { PaymentAccount } from '@/types/accounting'
import type { Customer } from '@/types/customer'
import type { InventoryProductLookupItem } from '@/types/inventory'
import type { PriceGroup } from '@/types/priceGroup'
import type { Product } from '@/types/product'
import type { CashRegister, Sale, SaleItem, SalePayment, SalePaymentCorrectionPayload, SalePaymentLinePayload, SalePayload } from '@/types/sales'
import type { TaxRate } from '@/types/taxRate'
import type { Warehouse } from '@/types/warehouse'
import { useCashRegistersQuery, useCreateCashRegisterMutation, useCreateSaleMutation, useDeleteSalePaymentMutation, useOpenCashRegisterSessionMutation, useRecordSalePaymentMutation, useSaleQuery, useUpdateSaleMutation, useUpdateSalePaymentMutation } from './hooks'
import { saleFormSchema, type SaleFormInput, type SaleFormValues } from './schema'

interface PosFormPageProps {
  saleId?: string
}

const discountTypes = ['fixed', 'percentage'] as const
const taxScopes = ['line', 'sale'] as const
const taxTypes = ['exclusive', 'inclusive'] as const
const paymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other'] as const

const cartColumnSx = {
  product: { width: 300, minWidth: 300 },
  quantity: { width: 170, minWidth: 170 },
  price: { width: 230, minWidth: 230 },
  total: { width: 132, minWidth: 132 },
  actions: { width: 96, minWidth: 96 },
} as const

type DirectPaymentLineInput = NonNullable<SaleFormInput['direct_payments']>[number]

function today() {
  return dayjs().format('YYYY-MM-DD')
}

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

function createClientRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function newDirectPaymentLine(paymentAccounts: PaymentAccount[] = []): DirectPaymentLineInput {
  return {
    payment_account_id: paymentAccounts.find((account) => account.is_active)?.id ?? paymentAccounts[0]?.id ?? '',
    payment_currency: 'USD',
    payment_amount: 0,
    method: 'cash',
    reference: '',
  }
}

function emptyValues(): SaleFormInput {
  return {
    branch_id: '',
    warehouse_id: '',
    customer_id: '',
    cash_register_session_id: '',
    type: 'pos_sale',
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
    direct_payment_enabled: true,
    direct_payments: [newDirectPaymentLine()],
    notes: '',
    staff_note: '',
    items: [],
  }
}

function itemName(item: SaleItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function valuesFromSale(sale: Sale | null | undefined): SaleFormInput {
  if (!sale) return emptyValues()

  const completedPayments = (sale.payments ?? []).filter((payment) => payment.status === 'completed')

  return {
    branch_id: sale.branch_id,
    warehouse_id: sale.warehouse_id,
    customer_id: sale.customer_id ?? '',
    cash_register_session_id: sale.cash_register_session_id ?? '',
    type: 'pos_sale',
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
    direct_payment_enabled: sale.status === 'completed',
    direct_payments: completedPayments.length > 0
      ? completedPayments.map(paymentToDirectPaymentLine)
      : [newDirectPaymentLine()],
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
  if (!type || !rateType || value <= 0) return { tax: 0, total: base }
  const tax = rateType === 'fixed' ? value : round(base * value / 100)

  if (type === 'inclusive') {
    const inclusiveTax = rateType === 'fixed' ? Math.min(base, value) : round(base - (base / (1 + value / 100)))
    return { tax: inclusiveTax, total: base }
  }

  return { tax, total: round(base + tax) }
}

function lineTotal(item: Partial<SaleFormInput['items'][number]> | null | undefined, taxScope: string) {
  if (!item) return 0

  const gross = round(toNumber(item.quantity) * toNumber(item.unit_price))
  const afterDiscount = Math.max(0, round(gross - discountAmount(item.discount_type, item.discount_amount, gross)))
  return taxScope === 'line'
    ? taxAmount(item.tax_type, item.tax_rate_type, item.tax_rate, afterDiscount).total
    : afterDiscount
}

function directPaymentLineBaseAmount(line: Partial<DirectPaymentLineInput> | null | undefined, exchangeRate: number) {
  const amount = round(toNumber(line?.payment_amount))
  if (line?.payment_currency === 'KHR') return exchangeRate > 0 ? round(amount / exchangeRate) : 0
  return amount
}

function formatUsdKhrAmount(amount: number, exchangeRate: number) {
  return {
    usd: `USD ${amount.toFixed(2)}`,
    khr: exchangeRate > 0 ? `KHR ${Math.round(amount * exchangeRate).toLocaleString()}` : 'KHR -',
  }
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

function paymentToDirectPaymentLine(payment: SalePayment): DirectPaymentLineInput {
  return {
    sale_payment_id: payment.id,
    payment_account_id: payment.payment_account_id,
    payment_currency: payment.payment_currency ?? 'USD',
    payment_amount: toNumber(payment.payment_amount ?? payment.amount),
    method: payment.method ?? 'cash',
    reference: payment.reference ?? '',
  }
}

function cashRegisterLabel(register: CashRegister) {
  return [register.name, register.branch?.name].filter(Boolean).join(' / ')
}

function categoryLabel(category: Category) {
  return category.name
}

function brandLabel(brand: Brand) {
  return brand.name
}

function productSearchTerm(product: Product) {
  return product.sku || product.variations?.[0]?.sku || product.name
}

function productPrice(product: Product) {
  if (product.selling_price !== null && product.selling_price !== undefined) return toNumber(product.selling_price)
  return toNumber(product.variations?.[0]?.selling_price)
}

function buildPayload(values: SaleFormValues): SalePayload {
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
      lot_allocations: item.lot_id ? [{ lot_id: item.lot_id, quantity: item.quantity }] : undefined,
      serial_ids: item.serial_id ? [item.serial_id] : undefined,
    })),
  }
}

function buildDirectPaymentLines(values: SaleFormValues, exchangeRate: number, exchangeRateId: string | null, saleTotal: number) {
  let remaining = round(saleTotal)

  return (values.direct_payments ?? []).flatMap((line) => {
    if (line.sale_payment_id) return []
    if (remaining <= 0) return []

    const payload = directPaymentLinePayload(line, values.sale_date, exchangeRate, exchangeRateId)
    if (!payload) return []

    const lineBaseAmount = round(payload.amount)
    if (lineBaseAmount <= 0) return []

    const appliedAmount = Math.min(lineBaseAmount, remaining)
    remaining = round(remaining - appliedAmount)

    return [{
      ...payload,
      amount: appliedAmount,
      payment_amount: payload.payment_currency === 'KHR' ? round(appliedAmount * exchangeRate) : appliedAmount,
    }]
  })
}

function directPaymentLinePayload(
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

function directPaymentLineChanged(line: Partial<DirectPaymentLineInput>, payment: SalePayment) {
  return line.payment_account_id !== payment.payment_account_id
    || (line.payment_currency ?? 'USD') !== (payment.payment_currency ?? 'USD')
    || round(toNumber(line.payment_amount)) !== round(toNumber(payment.payment_amount ?? payment.amount))
    || (line.method ?? 'cash') !== payment.method
}

export function PosFormPage({ saleId }: PosFormPageProps) {
  const { t } = useTranslation(['sales', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen)
  const [serverError, setServerError] = useState('')
  const [productTab, setProductTab] = useState<'featured' | 'category' | 'brand'>('featured')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [isAddingTileProduct, setIsAddingTileProduct] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [editingSummary, setEditingSummary] = useState<'discount' | 'tax' | 'shipping' | null>(null)
  const [cashRegisterDialogOpen, setCashRegisterDialogOpen] = useState(false)
  const [cashRegisterMode, setCashRegisterMode] = useState<'existing' | 'new'>('existing')
  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState('')
  const [newCashRegisterName, setNewCashRegisterName] = useState('')
  const [openingFloat, setOpeningFloat] = useState(0)
  const [cashRegisterNotes, setCashRegisterNotes] = useState('')
  const [clientRequestId, setClientRequestId] = useState(() => createClientRequestId())
  const [removedPaymentIds, setRemovedPaymentIds] = useState<string[]>([])
  const isEdit = !!saleId
  const currency = useAppCurrency()
  const currencyFormatter = useCurrencyFormatter()

  const saleQuery = useSaleQuery(saleId ?? null)
  const warehousesQuery = useWarehousesQuery({ per_page: 100 })
  const customersQuery = useCustomersQuery({ status: 'active', per_page: 100 })
  const categoriesQuery = useCategoriesQuery({ per_page: 100 })
  const brandsQuery = useBrandsQuery({ per_page: 100 })
  const productsQuery = useProductsQuery({
    is_active: true,
    per_page: 30,
    category_id: productTab === 'category' ? categoryId : undefined,
    brand_id: productTab === 'brand' ? brandId : undefined,
  })
  const priceGroupsQuery = usePriceGroupsQuery({ per_page: 100 })
  const taxRatesQuery = useTaxRatesQuery({ is_active: true, per_page: 100 })
  const paymentAccountsQuery = usePaymentAccountsQuery({ status: 'active', per_page: 100 })
  const defaultExchangeRateQuery = useDefaultExchangeRateQuery('USD', 'KHR')
  const createSale = useCreateSaleMutation()
  const updateSale = useUpdateSaleMutation()
  const recordPayment = useRecordSalePaymentMutation()
  const updatePayment = useUpdateSalePaymentMutation()
  const deletePayment = useDeleteSalePaymentMutation()
  const createRegister = useCreateCashRegisterMutation()
  const openSession = useOpenCashRegisterSessionMutation()
  const [isSubmittingSale, setIsSubmittingSale] = useState(false)
  const isSaving = isSubmittingSale || createSale.isPending || updateSale.isPending || recordPayment.isPending || updatePayment.isPending || deletePayment.isPending || createRegister.isPending || openSession.isPending

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
  const saleType = useWatch({ control, name: 'type' })
  const taxScope = useWatch({ control, name: 'tax_scope' })
  const watchedItemsValue = useWatch({ control, name: 'items' })
  const watchedItems = useMemo(() => watchedItemsValue ?? [], [watchedItemsValue])
  const saleDiscountType = useWatch({ control, name: 'discount_type' })
  const saleDiscountValue = useWatch({ control, name: 'discount_amount' })
  const saleTaxType = useWatch({ control, name: 'tax_type' })
  const saleTaxRateType = useWatch({ control, name: 'tax_rate_type' })
  const saleTaxRate = useWatch({ control, name: 'tax_rate' })
  const shippingCharges = useWatch({ control, name: 'shipping_charges' })
  const watchedDirectPaymentsValue = useWatch({ control, name: 'direct_payments' })
  const watchedDirectPayments = useMemo(() => watchedDirectPaymentsValue ?? [], [watchedDirectPaymentsValue])
  const cashRegisterSessionId = useWatch({ control, name: 'cash_register_session_id' })

  const cashRegistersQuery = useCashRegistersQuery({
    branch_id: branchId || undefined,
    status: 'active',
    per_page: 100,
  })

  const warehouses = useMemo(() => warehousesQuery.data?.data ?? [], [warehousesQuery.data?.data])
  const customers = customersQuery.data?.data ?? []
  const categories = categoriesQuery.data?.data ?? []
  const brands = brandsQuery.data?.data ?? []
  const products = productsQuery.data?.data ?? []
  const cashRegisters = useMemo(() => cashRegistersQuery.data?.data ?? [], [cashRegistersQuery.data?.data])
  const priceGroups = priceGroupsQuery.data?.data ?? []
  const taxRates = taxRatesQuery.data?.data ?? []
  const paymentAccounts = useMemo(
    () => (paymentAccountsQuery.data?.data ?? []).filter((account) => account.is_active),
    [paymentAccountsQuery.data?.data],
  )
  const defaultExchangeRate = defaultExchangeRateQuery.data ?? null
  const currentSale = saleQuery.data ?? null
  const currentSaleStatus = currentSale?.status
  const existingPayments = useMemo(
    () => (currentSale?.payments ?? []).filter((payment) => payment.status === 'completed'),
    [currentSale?.payments],
  )
  const existingPaymentById = useMemo(() => new Map(existingPayments.map((payment) => [payment.id, payment])), [existingPayments])
  const canManageExistingPayments = isEdit && can('payments.edit') && currentSaleStatus === 'completed'
  const canDeleteExistingPayments = isEdit && can('payments.delete') && currentSaleStatus === 'completed'
  const canAddPaymentLines = (isEdit ? can('payments.create') && currentSaleStatus === 'completed' : true)
  const defaultExchangeRateValue = toNumber(defaultExchangeRate?.rate)
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId) ?? null
  const selectedCashRegister = cashRegisters.find((register) => register.current_open_session?.id === cashRegisterSessionId) ?? null
  const dialogCashRegister = cashRegisters.find((register) => register.id === selectedCashRegisterId) ?? null

  const totals = useMemo(() => {
    const subtotal = round(watchedItems.reduce((sum, item) => sum + lineTotal(item, taxScope), 0))
    const saleDiscount = discountAmount(saleDiscountType, saleDiscountValue, subtotal)
    const discounted = Math.max(0, round(subtotal - saleDiscount))
    const saleTax = taxScope === 'sale' ? taxAmount(saleTaxType, saleTaxRateType, saleTaxRate, discounted).tax : 0

    return {
      subtotal,
      discount: saleDiscount,
      tax: saleTax,
      shipping: toNumber(shippingCharges),
      total: round(discounted + saleTax + toNumber(shippingCharges)),
    }
  }, [saleDiscountType, saleDiscountValue, saleTaxRate, saleTaxRateType, saleTaxType, shippingCharges, taxScope, watchedItems])

  const paymentBase = round(
    watchedDirectPayments.reduce((total, line) => total + directPaymentLineBaseAmount(line, defaultExchangeRateValue), 0),
  )
  const remaining = Math.max(0, round(totals.total - paymentBase))
  const change = Math.max(0, round(paymentBase - totals.total))
  const totalDisplay = formatUsdKhrAmount(totals.total, defaultExchangeRateValue)
  const paymentDisplay = formatUsdKhrAmount(paymentBase, defaultExchangeRateValue)
  const remainingDisplay = formatUsdKhrAmount(remaining, defaultExchangeRateValue)
  const changeDisplay = formatUsdKhrAmount(change, defaultExchangeRateValue)
  const isSuspended = saleType === 'suspended'
  const canCapturePayment = !isSuspended && (!isEdit || currentSaleStatus === 'completed')

  useEffect(() => {
    if (!currentSale) return

    if (currentSale.type !== 'pos_sale') {
      router.replace(`/sales/${currentSale.id}/edit`)
      return
    }

    reset(valuesFromSale(currentSale))
  }, [currentSale, reset, router])

  useEffect(() => {
    const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId)
    const nextBranchId = selectedWarehouse?.branch_id ?? ''

    if (warehouseId && nextBranchId && branchId !== nextBranchId) {
      setValue('branch_id', nextBranchId, { shouldDirty: true, shouldValidate: true })
    }
  }, [branchId, setValue, warehouseId, warehouses])

  useEffect(() => {
    if (paymentAccounts.length === 0) return

    watchedDirectPayments.forEach((line, index) => {
      if (!line?.payment_account_id) {
        setValue(`direct_payments.${index}.payment_account_id`, paymentAccounts[0].id, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
    })
  }, [paymentAccounts, setValue, watchedDirectPayments])

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

  useEffect(() => {
    setValue('direct_payment_enabled', !isSuspended && (!isEdit || currentSaleStatus === 'completed'), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }, [currentSaleStatus, isEdit, isSuspended, setValue])

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

  const openCashRegisterDialog = () => {
    if (!branchId) {
      enqueueSnackbar(t('form.selectWarehouseFirst'), { variant: 'warning' })
      return
    }

    setCashRegisterMode((current) => (cashRegisters.length === 0 ? 'new' : current))
    setSelectedCashRegisterId((current) => current || selectedCashRegister?.id || cashRegisters[0]?.id || '')
    setCashRegisterDialogOpen(true)
  }

  const selectOrOpenCashRegister = async () => {
    if (!branchId) {
      enqueueSnackbar(t('form.selectWarehouseFirst'), { variant: 'warning' })
      return
    }

    if (cashRegisterMode === 'new' && !newCashRegisterName.trim()) {
      enqueueSnackbar(t('pos.cashRegister.enterName'), { variant: 'warning' })
      return
    }

    const existingRegister = cashRegisters.find((item) => item.id === selectedCashRegisterId)

    if (cashRegisterMode === 'existing' && !existingRegister) {
      enqueueSnackbar(t('pos.cashRegister.selectRegister'), { variant: 'warning' })
      return
    }

    try {
      const register = cashRegisterMode === 'new'
        ? await createRegister.mutateAsync({
          branch_id: branchId,
          name: newCashRegisterName.trim(),
          is_active: true,
        })
        : existingRegister

      if (!register) return

      const session = register.current_open_session ?? await openSession.mutateAsync({
        id: register.id,
        payload: {
          opening_float: openingFloat,
          notes: cashRegisterNotes.trim() || null,
        },
      })

      setValue('cash_register_session_id', session.id, { shouldDirty: true, shouldValidate: true })
      setSelectedCashRegisterId(register.id)
      setNewCashRegisterName('')
      setCashRegisterMode('existing')
      setCashRegisterDialogOpen(false)
      enqueueSnackbar(t('pos.cashRegister.selected'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
    }
  }

  const addTileProduct = async (product: Product) => {
    if (!warehouseId) {
      enqueueSnackbar(t('form.selectWarehouseFirst'), { variant: 'warning' })
      return
    }

    setIsAddingTileProduct(true)

    try {
      const results = await inventoryApi.productLookup({
        q: productSearchTerm(product),
        warehouse_id: warehouseId,
      })
      const match = results.find((item) => item.product_id === product.id && item.is_exact_match)
        ?? results.find((item) => item.product_id === product.id)
        ?? results[0]

      if (!match) {
        enqueueSnackbar(t('pos.messages.productNotAvailable'), { variant: 'warning' })
        return
      }

      addLookupItem(match)
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
    } finally {
      setIsAddingTileProduct(false)
    }
  }

  const applyTaxRate = (index: number, taxRateId: string) => {
    const taxRate = taxRates.find((item) => item.id === taxRateId)
    setValue(`items.${index}.tax_rate_id`, taxRateId)
    setValue(`items.${index}.tax_rate_type`, taxRate?.type ?? null)
    setValue(`items.${index}.tax_rate`, taxRate?.rate ?? 0)
  }

  const changeDirectPaymentCurrency = (index: number, nextCurrency: 'USD' | 'KHR') => {
    const currentBaseAmount = directPaymentLineBaseAmount(watchedDirectPayments[index], defaultExchangeRateValue)
    const nextPaymentAmount = nextCurrency === 'KHR' && defaultExchangeRateValue > 0
      ? round(currentBaseAmount * defaultExchangeRateValue)
      : currentBaseAmount

    setValue(`direct_payments.${index}.payment_currency`, nextCurrency, { shouldDirty: true, shouldValidate: true })
    setValue(`direct_payments.${index}.payment_amount`, nextPaymentAmount, { shouldDirty: true, shouldValidate: true })
  }

  const removeDirectPaymentLine = (index: number) => {
    const paymentId = watchedDirectPayments[index]?.sale_payment_id

    if (paymentId) {
      setRemovedPaymentIds((current) => current.includes(paymentId) ? current : [...current, paymentId])
    }

    removeDirectPayment(index)
  }

  const submitForm = async (values: SaleFormValues) => {
    if (isSubmittingSale) return

    setIsSubmittingSale(true)
    setServerError('')

    try {
      const directPaymentLines = !isEdit && values.type === 'pos_sale'
        ? buildDirectPaymentLines(values, defaultExchangeRateValue, defaultExchangeRate?.id ?? null, totals.total)
        : []
      const editedPaymentLines = isEdit && saleId && values.type === 'pos_sale' && canManageExistingPayments
        ? (values.direct_payments ?? []).flatMap((line) => {
          if (!line.sale_payment_id) return []
          if (removedPaymentIds.includes(line.sale_payment_id)) return []

          const payment = existingPaymentById.get(line.sale_payment_id)
          const payload = directPaymentLinePayload(line, payment?.payment_date ?? values.sale_date, defaultExchangeRateValue, defaultExchangeRate?.id ?? null)
          if (!payment || !payload || !directPaymentLineChanged(line, payment)) return []

          return [{
            paymentId: payment.id,
            previousAmount: toNumber(payment.amount),
            nextAmount: payload.amount,
            payload: {
              ...payload,
              payment_date: payment.payment_date ?? values.sale_date,
              note: payment.note ?? null,
              reason: t('payment.posCorrectionReason'),
            } satisfies SalePaymentCorrectionPayload,
          }]
        }).sort((a, b) => (a.nextAmount - a.previousAmount) - (b.nextAmount - b.previousAmount))
        : []
      const newPaymentLines = isEdit && saleId && values.type === 'pos_sale' && canAddPaymentLines
        ? (values.direct_payments ?? []).flatMap((line) => {
          if (line.sale_payment_id) return []
          const payload = directPaymentLinePayload(line, values.sale_date, defaultExchangeRateValue, defaultExchangeRate?.id ?? null)
          return payload ? [payload] : []
        })
        : []
      const deletedPaymentIds = isEdit && saleId && values.type === 'pos_sale' && canDeleteExistingPayments
        ? removedPaymentIds.filter((paymentId) => existingPaymentById.has(paymentId))
        : []

      const payload = {
        ...buildPayload({ ...values, type: 'pos_sale' }),
        ...(!isEdit ? { client_request_id: clientRequestId } : {}),
        ...(!isEdit && directPaymentLines.length > 0
          ? { payment_date: values.sale_date, payment_note: null, payments: directPaymentLines }
          : {}),
      }

      if (isEdit && saleId) {
        await updateSale.mutateAsync({ id: saleId, payload })

        for (const paymentId of deletedPaymentIds) {
          await deletePayment.mutateAsync({
            saleId,
            paymentId,
            payload: { reason: t('payment.posDeleteReason') },
          })
        }

        for (const paymentLine of editedPaymentLines) {
          await updatePayment.mutateAsync({
            saleId,
            paymentId: paymentLine.paymentId,
            payload: paymentLine.payload,
          })
        }

        if (newPaymentLines.length > 0) {
          await recordPayment.mutateAsync({
            id: saleId,
            payload: {
              payment_date: values.sale_date,
              note: null,
              payments: newPaymentLines,
            },
          })
        }
      } else {
        await createSale.mutateAsync(payload)
      }

      if (values.type === 'pos_sale') {
        if (directPaymentLines.length > 0) {
          enqueueSnackbar(t('pos.messages.completed'), { variant: 'success' })
        } else if (isEdit) {
          enqueueSnackbar(t('pos.messages.updated'), { variant: 'success' })
        } else {
          enqueueSnackbar(t('messages.completed'), { variant: 'success' })
        }
      } else if (values.type === 'suspended') {
        enqueueSnackbar(t('pos.messages.suspended'), { variant: 'success' })
      } else {
        enqueueSnackbar(t('messages.created'), { variant: 'success' })
      }

      if (isEdit) {
        router.push('/pos')
      } else {
        reset(emptyValues())
        setClientRequestId(createClientRequestId())
      }
      setEditingItemIndex(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof SaleFormInput, { type: 'server', message: messages[0] })
        })
      }
      setServerError(apiError.message)
    } finally {
      setIsSubmittingSale(false)
    }
  }

  const submitAs = (type: SaleFormValues['type']) => {
    const directPaymentEnabled = type === 'pos_sale' && (!isEdit || currentSaleStatus === 'completed')
    setValue('type', type, { shouldDirty: true, shouldValidate: false })
    setValue('direct_payment_enabled', directPaymentEnabled, { shouldDirty: true, shouldValidate: false })
    window.setTimeout(() => {
      void handleSubmit((values) => submitForm({ ...values, type, direct_payment_enabled: directPaymentEnabled }))()
    }, 0)
  }

  if (isEdit && saleQuery.isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isEdit && saleQuery.isError) {
    return (
      <Box sx={{ minHeight: '100vh', p: 3 }}>
        <Alert severity="error">{toAppApiError(saleQuery.error).message}</Alert>
      </Box>
    )
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(submitForm)}
      sx={{
        minHeight: '100vh',
        bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.06 : 0.035),
        color: 'text.primary',
      }}
    >
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{t('pos.location')}</Typography>
              <Typography variant="body2">{selectedWarehouse?.branch?.name || selectedWarehouse?.name || '-'}</Typography>
              <Box sx={{ px: 1.5, py: 0.75, borderRadius: 1, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                  {dayjs().format('MM/DD/YYYY HH:mm')}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Tooltip title={t('pos.toolbar.back')}>
                <IconButton size="small" onClick={() => router.push('/sales')}>
                  <ArrowBack />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('pos.toolbar.pos')}>
                <IconButton size="small" color="primary">
                  <PointOfSaleOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title={selectedCashRegister ? selectedCashRegister.name : t('pos.cashRegister.title')}>
                <IconButton
                  size="small"
                  color={selectedCashRegister ? 'success' : 'default'}
                  onClick={openCashRegisterDialog}
                >
                  <AccountBalanceWalletOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('pos.toolbar.settings')}>
                <IconButton size="small" onClick={() => setSettingsOpen(true)}>
                  <SettingsOutlined />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(430px, 2fr)' },
          }}
        >
          <Box sx={{ minWidth: 0, p: { xs: 2, md: 3 }, overflow: 'auto' }}>
            <Stack spacing={2}>
              {serverError && <Alert severity="error">{serverError}</Alert>}

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.2fr) minmax(0, 1fr) 170px 170px' },
                  gap: 1.5,
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                }}
              >
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
                  name="due_date"
                  control={control}
                  render={({ field }) => <AppDatePicker label={t('fields.dueDate')} value={field.value ?? ''} onChange={(value) => field.onChange(value ?? '')} error={!!errors.due_date} helperText={errors.due_date?.message} />}
                />
              </Box>

              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                <Stack spacing={1.5}>
                  <InventoryProductLookupPicker
                    warehouseId={warehouseId || undefined}
                    disabled={!warehouseId || isSaving}
                    autoFocus
                    label={t('pos.scanLabel')}
                    helperText={warehouseId ? t('form.pickerHelp') : t('form.selectWarehouseFirst')}
                    onSelect={addLookupItem}
                  />
                  {typeof errors.items?.message === 'string' && <Alert severity="error">{errors.items.message}</Alert>}

                  <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 928, tableLayout: 'fixed' }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={cartColumnSx.product}>{t('items.product')}</TableCell>
                          <TableCell sx={cartColumnSx.quantity} align="right">{t('items.quantity')}</TableCell>
                          <TableCell sx={cartColumnSx.price} align="right">{t('items.unitPrice')}</TableCell>
                          <TableCell sx={cartColumnSx.total} align="right">{t('items.total')}</TableCell>
                          <TableCell sx={cartColumnSx.actions} align="right">{t('columns.actions')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {itemFields.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('pos.emptyCart')}</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        {itemFields.map((field, index) => (
                          <TableRow key={field.fieldId}>
                            <TableCell sx={cartColumnSx.product}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{field.product_label || field.product_id}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {[field.sku, field.lot_number, field.serial_number, field.unit_label].filter(Boolean).join(' / ') || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={cartColumnSx.quantity}>
                              <Stack direction="row" spacing={0} sx={{ justifyContent: 'flex-end' }}>
                                <Button
                                  type="button"
                                  variant="outlined"
                                  size="small"
                                  sx={{ minWidth: 36, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                                  onClick={() => setValue(`items.${index}.quantity`, Math.max(0.0001, round(toNumber(watchedItems[index]?.quantity ?? field.quantity) - 1)), { shouldDirty: true, shouldValidate: true })}
                                >
                                  -
                                </Button>
                                <Controller name={`items.${index}.quantity`} control={control} render={({ field }) => (
                                  <TextField
                                    {...field}
                                    type="number"
                                    error={!!errors.items?.[index]?.quantity}
                                    helperText={errors.items?.[index]?.quantity?.message}
                                    required
                                    sx={{ width: 84, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                                    slotProps={{ htmlInput: { min: 0.0001, step: 0.0001, style: { textAlign: 'center' } } }}
                                  />
                                )} />
                                <Button
                                  type="button"
                                  variant="outlined"
                                  size="small"
                                  sx={{ minWidth: 36, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                  onClick={() => setValue(`items.${index}.quantity`, round(toNumber(watchedItems[index]?.quantity ?? field.quantity) + 1), { shouldDirty: true, shouldValidate: true })}
                                >
                                  +
                                </Button>
                              </Stack>
                            </TableCell>
                            <TableCell align="right" sx={cartColumnSx.price}>
                              <Controller name={`items.${index}.unit_price`} control={control} render={({ field }) => (
                                <TextField {...field} fullWidth type="number" error={!!errors.items?.[index]?.unit_price} helperText={errors.items?.[index]?.unit_price?.message} required slotProps={{ htmlInput: { min: 0, step: 0.01 }, input: { startAdornment: <InputAdornment position="start">{currency}</InputAdornment> } }} />
                              )} />
                            </TableCell>
                            <TableCell align="right" sx={cartColumnSx.total}>
                              <Typography variant="subtitle2">{currencyFormatter.format(lineTotal(watchedItems[index] ?? field, taxScope))}</Typography>
                            </TableCell>
                            <TableCell align="right" sx={cartColumnSx.actions}>
                              <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                                <Tooltip title={t('pos.actions.editLine')}>
                                  <span>
                                    <IconButton size="small" disabled={isSaving} onClick={() => setEditingItemIndex(index)}>
                                      <EditOutlined />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title={t('actions.removeItem')}>
                                  <span>
                                    <IconButton size="small" color="error" disabled={isSaving} onClick={() => remove(index)}>
                                      <DeleteOutlined />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              </Box>

              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, minmax(0, 1fr))' },
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  {[
                    { key: 'items', label: t('pos.summary.items'), value: watchedItems.length.toString() },
                    { key: 'subtotal', label: t('fields.subtotal'), value: currencyFormatter.format(totals.subtotal) },
                    { key: 'discount', label: t('fields.discount'), value: currencyFormatter.format(totals.discount), color: 'error.main', edit: 'discount' as const },
                    { key: 'tax', label: t('fields.tax'), value: currencyFormatter.format(totals.tax), edit: 'tax' as const },
                    { key: 'shipping', label: t('fields.shipping'), value: currencyFormatter.format(totals.shipping), edit: 'shipping' as const },
                  ].map((item) => (
                    <Box key={item.key} sx={{ p: 1.25, textAlign: 'center', borderRight: { md: 1 }, borderColor: 'divider' }}>
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                          {item.label}
                        </Typography>
                        {item.edit && (
                          <Tooltip title={t('pos.summary.edit')}>
                            <IconButton size="small" onClick={() => setEditingSummary(item.edit)} sx={{ p: 0.25 }}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                      <Typography variant="subtitle2" sx={{ color: item.color ?? 'text.primary', fontWeight: 800 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 280px' },
                    alignItems: 'stretch',
                  }}
                >
                  <Box sx={{ p: 1.5 }}>
                    {canCapturePayment && (
                      <Stack spacing={1.25}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">{t('payment.directTitle')}</Typography>
                          <Button
                            type="button"
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => appendDirectPayment(newDirectPaymentLine(paymentAccounts))}
                            disabled={isSaving || paymentAccounts.length === 0 || !canAddPaymentLines}
                          >
                            {t('payment.addLine')}
                          </Button>
                        </Stack>
                        {paymentAccounts.length === 0 && <Alert severity="warning">{t('payment.noAccounts')}</Alert>}
                        {!defaultExchangeRateQuery.isLoading && !defaultExchangeRate && <Alert severity="info">{t('payment.noExchangeRate')}</Alert>}
                        {typeof errors.direct_payments?.message === 'string' && <Alert severity="error">{errors.direct_payments.message}</Alert>}
                        {directPaymentFields.map((field, index) => {
                          const line = watchedDirectPayments[index]
                          const isExistingPaymentLine = !!line?.sale_payment_id
                          const lineDisabled = isSaving
                            || (isExistingPaymentLine ? !canManageExistingPayments : !canAddPaymentLines)

                          return (
                            <Box
                              key={field.fieldId}
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: 'minmax(180px, 1fr) 92px 150px 150px 48px' },
                                gap: 1,
                                alignItems: 'start',
                              }}
                            >
                              <Controller
                                name={`direct_payments.${index}.payment_account_id`}
                                control={control}
                                render={({ field }) => (
                                  <Autocomplete
                                    fullWidth
                                    disabled={lineDisabled}
                                    options={paymentAccounts}
                                    value={paymentAccounts.find((account) => account.id === field.value) ?? null}
                                    loading={paymentAccountsQuery.isLoading}
                                    getOptionLabel={paymentAccountLabel}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onBlur={field.onBlur}
                                    onChange={(_, account) => field.onChange(account?.id ?? '')}
                                    renderInput={(params) => <TextField {...params} label={t('payment.account')} error={!!errors.direct_payments?.[index]?.payment_account_id} helperText={errors.direct_payments?.[index]?.payment_account_id?.message} required />}
                                  />
                                )}
                              />
                              <Controller
                                name={`direct_payments.${index}.payment_currency`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    value={field.value ?? 'USD'}
                                    select
                                    disabled={lineDisabled}
                                    label={t('payment.currency')}
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
                              <Controller
                                name={`direct_payments.${index}.payment_amount`}
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    value={field.value ?? ''}
                                    type="number"
                                    disabled={lineDisabled}
                                    label={t('payment.amount')}
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
                              <Controller
                                name={`direct_payments.${index}.method`}
                                control={control}
                                render={({ field }) => (
                                  <TextField {...field} value={field.value ?? 'cash'} select disabled={lineDisabled} label={t('payment.method')} error={!!errors.direct_payments?.[index]?.method} helperText={errors.direct_payments?.[index]?.method?.message} required>
                                    {paymentMethods.map((method) => <MenuItem key={method} value={method}>{t(`paymentMethods.${method}`)}</MenuItem>)}
                                  </TextField>
                                )}
                              />
                              <Tooltip title={t('payment.removeLine')}>
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    disabled={isSaving || directPaymentFields.length === 1 || (isExistingPaymentLine && !canDeleteExistingPayments)}
                                    onClick={() => removeDirectPaymentLine(index)}
                                  >
                                    <DeleteOutlined />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          )
                        })}
                      </Stack>
                    )}
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: 'success.lighter', textAlign: 'center', display: 'grid', alignContent: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 800, textTransform: 'uppercase' }}>{t('pos.totalPayable')}</Typography>
                    <Typography variant="h4" sx={{ color: 'success.dark', fontWeight: 900 }}>{totalDisplay.usd.replace('USD ', '')}</Typography>
                    <Typography variant="body2" sx={{ color: 'success.dark' }}>{totalDisplay.khr}</Typography>
                    {canCapturePayment && (
                      <Stack spacing={0.25} sx={{ mt: 1 }}>
                        <Typography variant="caption">{t('payment.totalEntered')}: {paymentDisplay.usd}</Typography>
                        <Typography variant="caption">{change > 0 ? t('payment.changeBack') : t('payment.remaining')}: {change > 0 ? changeDisplay.usd : remainingDisplay.usd}</Typography>
                      </Stack>
                    )}
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr)' },
                  gap: 1.5,
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                }}
              >
                <Controller name="price_group_id" control={control} render={({ field }) => (
                  <Autocomplete
                    options={priceGroups}
                    value={priceGroups.find((group) => group.id === field.value) ?? null}
                    loading={priceGroupsQuery.isLoading}
                    getOptionLabel={priceGroupLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onBlur={field.onBlur}
                    onChange={(_, group) => field.onChange(group?.id ?? '')}
                    renderInput={(params) => <TextField {...params} label={t('fields.priceGroup')} error={!!errors.price_group_id} helperText={errors.price_group_id?.message || t('form.noPriceGroup')} />}
                  />
                )} />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 1.5,
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                }}
              >
                <Controller name="notes" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={t('fields.notes')} error={!!errors.notes} helperText={errors.notes?.message} multiline minRows={2} />
                )} />
                <Controller name="staff_note" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={t('fields.staffNote')} error={!!errors.staff_note} helperText={errors.staff_note?.message} multiline minRows={2} />
                )} />
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              minWidth: 0,
              borderLeft: { lg: 1 },
              borderTop: { xs: 1, lg: 0 },
              borderColor: 'divider',
              bgcolor: 'background.paper',
              p: 2,
              overflow: 'auto',
            }}
          >
            <Stack spacing={2}>
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <Stack spacing={1.5}>
                  <ToggleButtonGroup
                    fullWidth
                    exclusive
                    size="small"
                    value={productTab}
                    onChange={(_, nextTab) => {
                      if (!nextTab) return
                      setProductTab(nextTab)
                    }}
                  >
                    <ToggleButton value="featured">{t('pos.productTabs.featured')}</ToggleButton>
                    <ToggleButton value="category">{t('pos.productTabs.category')}</ToggleButton>
                    <ToggleButton value="brand">{t('pos.productTabs.brand')}</ToggleButton>
                  </ToggleButtonGroup>

                  {productTab === 'category' && (
                    <Autocomplete
                      options={categories}
                      value={categories.find((category) => category.id === categoryId) ?? null}
                      loading={categoriesQuery.isLoading}
                      getOptionLabel={categoryLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onChange={(_, category) => setCategoryId(category?.id ?? '')}
                      renderInput={(params) => <TextField {...params} label={t('pos.filters.category')} />}
                    />
                  )}

                  {productTab === 'brand' && (
                    <Autocomplete
                      options={brands}
                      value={brands.find((brand) => brand.id === brandId) ?? null}
                      loading={brandsQuery.isLoading}
                      getOptionLabel={brandLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onChange={(_, brand) => setBrandId(brand?.id ?? '')}
                      renderInput={(params) => <TextField {...params} label={t('pos.filters.brand')} />}
                    />
                  )}

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
                      gap: 1,
                      maxHeight: { xs: 360, lg: 'calc(100vh - 390px)' },
                      overflowY: 'auto',
                      pr: 0.5,
                    }}
                  >
                    {productsQuery.isLoading && (
                      <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                      </Box>
                    )}
                    {!productsQuery.isLoading && products.length === 0 && (
                      <Box sx={{ gridColumn: '1 / -1', py: 4, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('pos.noProducts')}</Typography>
                      </Box>
                    )}
                    {products.map((product) => {
                      const price = productPrice(product)

                      return (
                        <CardActionArea
                          key={product.id}
                          disabled={!warehouseId || isSaving || isAddingTileProduct || !product.is_for_selling}
                          onClick={() => void addTileProduct(product)}
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: 'background.default',
                            minHeight: 156,
                            display: 'flex',
                            alignItems: 'stretch',
                          }}
                        >
                          <Stack spacing={0.75} sx={{ width: '100%', p: 1, alignItems: 'center', textAlign: 'center' }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: 62,
                                borderRadius: 1,
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                                backgroundImage: product.image_url ? `url(${product.image_url})` : 'none',
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 700, width: '100%' }} noWrap title={product.name}>
                              {product.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                              {product.sku || product.variations?.[0]?.sku || '-'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                              {currencyFormatter.format(price)}
                            </Typography>
                          </Stack>
                        </CardActionArea>
                      )
                    })}
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Box>
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '160px 1fr 220px' },
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <Button type="button" variant="outlined" color="error" disabled={isSaving} onClick={() => reset(emptyValues())}>
            {t('common:buttons.cancel')}
          </Button>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button type="button" variant="text" disabled={isSaving} onClick={() => submitAs('draft')}>
              {t('types.draft')}
            </Button>
            <Button type="button" variant="text" disabled={isSaving} onClick={() => submitAs('quotation')}>
              {t('types.quotation')}
            </Button>
            <Button type="button" variant="text" color="warning" disabled={isSaving} onClick={() => submitAs('suspended')}>
              {t('types.suspended')}
            </Button>
            <Button type="button" variant="text" disabled>
              {t('pos.actions.creditSale')}
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ justifyContent: { md: 'flex-end' } }}>
            <Button type="button" variant="outlined" onClick={() => router.push('/sales')}>
              {t('pos.recentTransactions')}
            </Button>
            <Button type="button" variant="contained" disabled={isSaving} onClick={() => submitAs(saleType)}>
              {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
            </Button>
          </Stack>
        </Box>
      </Box>
      <Dialog open={editingItemIndex !== null} onClose={() => setEditingItemIndex(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('pos.lineDialog.title')}</DialogTitle>
        <DialogContent>
          {editingItemIndex !== null && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <Controller name={`items.${editingItemIndex}.discount_type`} control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} select label={t('fields.discountType')} error={!!errors.items?.[editingItemIndex]?.discount_type}>
                    <MenuItem value="">{t('form.noDiscount')}</MenuItem>
                    {discountTypes.map((type) => <MenuItem key={type} value={type}>{t(`discountTypes.${type}`)}</MenuItem>)}
                  </TextField>
                )} />
                <Controller name={`items.${editingItemIndex}.discount_amount`} control={control} render={({ field }) => (
                  <TextField {...field} fullWidth value={field.value ?? ''} type="number" label={t('fields.discount')} error={!!errors.items?.[editingItemIndex]?.discount_amount} helperText={errors.items?.[editingItemIndex]?.discount_amount?.message} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                )} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <Controller name={`items.${editingItemIndex}.tax_rate_id`} control={control} render={({ field }) => (
                  <Autocomplete
                    fullWidth
                    options={taxRates}
                    value={taxRates.find((rate) => rate.id === field.value) ?? null}
                    loading={taxRatesQuery.isLoading}
                    getOptionLabel={taxRateLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    disabled={taxScope !== 'line'}
                    onBlur={field.onBlur}
                    onChange={(_, rate) => applyTaxRate(editingItemIndex, rate?.id ?? '')}
                    renderInput={(params) => (
                      <TextField {...params} label={t('fields.tax')} error={!!errors.items?.[editingItemIndex]?.tax_rate_id} helperText={errors.items?.[editingItemIndex]?.tax_rate_id?.message || (taxScope !== 'line' ? t('pos.lineDialog.saleTaxMode') : undefined)} />
                    )}
                  />
                )} />
                <Controller name={`items.${editingItemIndex}.tax_type`} control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? 'exclusive'} select label={t('fields.taxType')} error={!!errors.items?.[editingItemIndex]?.tax_type} helperText={errors.items?.[editingItemIndex]?.tax_type?.message} disabled={taxScope !== 'line'}>
                    {taxTypes.map((type) => <MenuItem key={type} value={type}>{t(`taxTypes.${type}`)}</MenuItem>)}
                  </TextField>
                )} />
              </Box>
              <Controller name={`items.${editingItemIndex}.notes`} control={control} render={({ field }) => (
                <TextField {...field} fullWidth value={field.value ?? ''} label={t('fields.notes')} error={!!errors.items?.[editingItemIndex]?.notes} helperText={errors.items?.[editingItemIndex]?.notes?.message} multiline minRows={3} />
              )} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setEditingItemIndex(null)}>{t('common:buttons.cancel')}</Button>
          <Button variant="contained" onClick={() => setEditingItemIndex(null)}>{t('common:buttons.save')}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={cashRegisterDialogOpen} onClose={() => setCashRegisterDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('pos.cashRegister.title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {!branchId && <Alert severity="warning">{t('form.selectWarehouseFirst')}</Alert>}
            <ToggleButtonGroup
              color="primary"
              exclusive
              fullWidth
              value={cashRegisterMode}
              onChange={(_, value: 'existing' | 'new' | null) => {
                if (value) setCashRegisterMode(value)
              }}
            >
              <ToggleButton value="existing" disabled={cashRegisters.length === 0}>
                {t('pos.cashRegister.existingRegister')}
              </ToggleButton>
              <ToggleButton value="new">{t('pos.cashRegister.newRegister')}</ToggleButton>
            </ToggleButtonGroup>
            {cashRegisterMode === 'existing' ? (
              <Autocomplete
                options={cashRegisters}
                value={dialogCashRegister}
                loading={cashRegistersQuery.isLoading}
                getOptionLabel={cashRegisterLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, register) => setSelectedCashRegisterId(register?.id ?? '')}
                renderOption={(props, register) => (
                  <Box component="li" {...props} key={register.id}>
                    <Box>
                      <Typography variant="body2">{register.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {register.current_open_session ? t('pos.cashRegister.open') : t('pos.cashRegister.closed')}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('pos.cashRegister.register')}
                    helperText={cashRegisters.length === 0 && !cashRegistersQuery.isLoading ? t('pos.cashRegister.noRegisters') : undefined}
                  />
                )}
              />
            ) : (
              <TextField
                label={t('pos.cashRegister.newRegisterName')}
                value={newCashRegisterName}
                onChange={(event) => setNewCashRegisterName(event.target.value)}
                required
                autoFocus
              />
            )}
            {(cashRegisterMode === 'new' || !dialogCashRegister?.current_open_session) && (
              <>
                <TextField
                  type="number"
                  label={t('pos.cashRegister.openingFloat')}
                  value={openingFloat}
                  onChange={(event) => setOpeningFloat(toNumber(event.target.value))}
                  slotProps={{ htmlInput: { min: 0, step: 0.01 }, input: { startAdornment: <InputAdornment position="start">{currency}</InputAdornment> } }}
                />
                <TextField
                  label={t('pos.cashRegister.notes')}
                  value={cashRegisterNotes}
                  onChange={(event) => setCashRegisterNotes(event.target.value)}
                  multiline
                  minRows={2}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setCashRegisterDialogOpen(false)}>{t('common:buttons.cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => void selectOrOpenCashRegister()}
            disabled={createRegister.isPending || openSession.isPending || (cashRegisterMode === 'existing' && !selectedCashRegisterId)}
          >
            {createRegister.isPending || openSession.isPending ? <CircularProgress size={20} color="inherit" /> : t('pos.cashRegister.useRegister')}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editingSummary === 'discount'} onClose={() => setEditingSummary(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('pos.summaryDialog.discountTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Controller name="discount_type" control={control} render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} select label={t('fields.discountType')} error={!!errors.discount_type} helperText={errors.discount_type?.message}>
                <MenuItem value="">{t('form.noDiscount')}</MenuItem>
                {discountTypes.map((type) => <MenuItem key={type} value={type}>{t(`discountTypes.${type}`)}</MenuItem>)}
              </TextField>
            )} />
            <Controller name="discount_amount" control={control} render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} type="number" label={t('fields.discount')} error={!!errors.discount_amount} helperText={errors.discount_amount?.message} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
            )} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setEditingSummary(null)}>{t('common:buttons.cancel')}</Button>
          <Button variant="contained" onClick={() => setEditingSummary(null)}>{t('common:buttons.save')}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editingSummary === 'tax'} onClose={() => setEditingSummary(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('pos.summaryDialog.taxTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl error={!!errors.tax_scope}>
              <InputLabel id="pos-tax-scope-dialog-label">{t('fields.taxScope')}</InputLabel>
              <Controller name="tax_scope" control={control} render={({ field }) => (
                <Select {...field} labelId="pos-tax-scope-dialog-label" label={t('fields.taxScope')}>
                  {taxScopes.map((scope) => <MenuItem key={scope} value={scope}>{t(`taxScopes.${scope}`)}</MenuItem>)}
                </Select>
              )} />
              <FormHelperText>{errors.tax_scope?.message}</FormHelperText>
            </FormControl>
            {taxScope === 'sale' && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
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
                    renderInput={(params) => <TextField {...params} label={t('fields.tax')} error={!!errors.tax_rate_id} helperText={errors.tax_rate_id?.message || t('form.noTax')} />}
                  />
                )} />
                <Controller name="tax_type" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? 'exclusive'} select label={t('fields.taxType')} error={!!errors.tax_type} helperText={errors.tax_type?.message}>
                    {taxTypes.map((type) => <MenuItem key={type} value={type}>{t(`taxTypes.${type}`)}</MenuItem>)}
                  </TextField>
                )} />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setEditingSummary(null)}>{t('common:buttons.cancel')}</Button>
          <Button variant="contained" onClick={() => setEditingSummary(null)}>{t('common:buttons.save')}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={editingSummary === 'shipping'} onClose={() => setEditingSummary(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t('pos.summaryDialog.shippingTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Controller name="shipping_charges" control={control} render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} type="number" label={t('fields.shipping')} error={!!errors.shipping_charges} helperText={errors.shipping_charges?.message} slotProps={{ htmlInput: { min: 0, step: 0.01 }, input: { startAdornment: <InputAdornment position="start">{currency}</InputAdornment> } }} />
            )} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setEditingSummary(null)}>{t('common:buttons.cancel')}</Button>
          <Button variant="contained" onClick={() => setEditingSummary(null)}>{t('common:buttons.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
