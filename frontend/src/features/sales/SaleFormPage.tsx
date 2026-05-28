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
import { Add, ArrowBack, DangerCircleOutlined, DeleteOutlined, SaveOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { useDefaultExchangeRateQuery, usePaymentAccountsQuery } from '@/features/accounting/hooks'
import { useCustomersQuery } from '@/features/customers/hooks'
import { InventoryProductLookupPicker } from '@/features/inventory/components/InventoryProductLookupPicker'
import { usePriceGroupsQuery } from '@/features/price-groups/hooks'
import { useAppCurrency, useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useTaxRatesQuery } from '@/features/tax-rates/hooks'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { useAuthStore } from '@/stores/authStore'
import {
  useCreateSaleMutation,
  useCreateQuotationMutation,
  useSaleQuery,
  useUpdateSaleWithPaymentsMutation,
} from './hooks'
import {
  buildDirectPaymentLines,
  buildSalePayload,
  buildSalePaymentChangePayloads,
  createClientRequestId,
  directPaymentLineBaseAmount,
  discountAmount,
  formatUsdKhrAmount,
  lineTotal,
  newDirectPaymentLine,
  paymentToDirectPaymentLine,
  round,
  taxAmount,
  toNumber,
  type DirectPaymentLineInput,
} from './formHelpers'
import { saleFormSchema, type SaleFormInput, type SaleFormValues } from './schema'
import type { PaymentAccount } from '@/types/accounting'
import type { InventoryProductLookupItem } from '@/types/inventory'
import type { Sale, SaleItem } from '@/types/sales'
import type { Warehouse } from '@/types/warehouse'
import type { Customer } from '@/types/customer'
import type { PriceGroup } from '@/types/priceGroup'
import type { TaxRate } from '@/types/taxRate'

interface SaleFormPageProps {
  saleId?: string
  mode?: 'sale' | 'quotation'
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

function emptyValues(type: SaleFormInput['type'] = 'invoice'): SaleFormInput {
  return {
    branch_id: '',
    warehouse_id: '',
    customer_id: '',
    type,
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

function valuesFromSale(sale: Sale | null | undefined): SaleFormInput {
  if (!sale) return emptyValues()

  const completedPayments = (sale.payments ?? []).filter((payment) => payment.status === 'completed')

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
    direct_payment_enabled: completedPayments.length > 0,
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

function InstructionTooltip({ title }: { title: string }) {
  return (
    <Tooltip title={title}>
      <IconButton size="small" color="warning" sx={{ ml: 0.5 }} aria-label={title}>
        <DangerCircleOutlined fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}

export function SaleFormPage({ saleId, mode = 'sale' }: SaleFormPageProps) {
  const { t } = useTranslation(['sales', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [serverError, setServerError] = useState('')
  const [clientRequestId, setClientRequestId] = useState(() => createClientRequestId())
  const [removedPaymentIds, setRemovedPaymentIds] = useState<string[]>([])
  const isEdit = !!saleId
  const isQuotationMode = mode === 'quotation'
  const currency = useAppCurrency()
  const currencyFormatter = useCurrencyFormatter()

  const saleQuery = useSaleQuery(saleId ?? null)
  const customersQuery = useCustomersQuery({ status: 'active', per_page: 100 })
  const priceGroupsQuery = usePriceGroupsQuery({ per_page: 100 })
  const taxRatesQuery = useTaxRatesQuery({ is_active: true, per_page: 100 })
  const createSale = useCreateSaleMutation()
  const createQuotation = useCreateQuotationMutation()
  const updateSaleWithPayments = useUpdateSaleWithPaymentsMutation()
  const [isSubmittingSale, setIsSubmittingSale] = useState(false)
  const isSaving = isSubmittingSale || createSale.isPending || createQuotation.isPending || updateSaleWithPayments.isPending

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<SaleFormInput, unknown, SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: emptyValues(isQuotationMode ? 'quotation' : 'invoice'),
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
  const existingPayments = useMemo(
    () => (currentSale?.payments ?? []).filter((payment) => payment.status === 'completed'),
    [currentSale?.payments],
  )
  const existingPaymentById = useMemo(() => new Map(existingPayments.map((payment) => [payment.id, payment])), [existingPayments])
  const canManageExistingPayments = isEdit && can('payments.edit') && currentSaleStatus === 'completed'
  const canDeleteExistingPayments = isEdit && can('payments.delete') && currentSaleStatus === 'completed'
  const canAddPaymentLines = isEdit ? can('payments.create') && currentSaleStatus === 'completed' : true
  const editPaymentLimit = totals.total
  const canTakeDirectPayment = !isQuotationMode
    && (saleType === 'invoice' || saleType === 'pos_sale')
    && (!isEdit || ['draft', 'suspended', 'confirmed', 'completed'].includes(String(currentSaleStatus ?? '')))
  const directPaymentRemaining = Math.max(0, round(editPaymentLimit - directPaymentBase))
  const directPaymentChange = Math.max(0, round(directPaymentBase - editPaymentLimit))
  const directPaymentRemainingDisplay = formatUsdKhrAmount(directPaymentRemaining, defaultExchangeRateValue)
  const directPaymentChangeDisplay = formatUsdKhrAmount(directPaymentChange, defaultExchangeRateValue)
  const showPaymentSection = canTakeDirectPayment || (isEdit && existingPayments.length > 0)

  useEffect(() => {
    if (saleQuery.data) reset(valuesFromSale(saleQuery.data))
  }, [reset, saleQuery.data])

  useEffect(() => {
    if (isQuotationMode && saleType !== 'quotation') {
      setValue('type', 'quotation', { shouldDirty: true, shouldValidate: true })
    }

    const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId)
    const nextBranchId = selectedWarehouse?.branch_id ?? ''

    if (warehouseId && nextBranchId && branchId !== nextBranchId) {
      setValue('branch_id', nextBranchId, { shouldDirty: true, shouldValidate: true })
    }
  }, [branchId, isQuotationMode, saleType, setValue, warehouseId, warehouses])

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

  const removeDirectPaymentLine = (index: number) => {
    const paymentId = watchedDirectPayments[index]?.sale_payment_id

    if (paymentId) {
      setRemovedPaymentIds((current) => current.includes(paymentId) ? current : [...current, paymentId])
    }

    removeDirectPayment(index)
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
    if (isSubmittingSale) return

    setIsSubmittingSale(true)
    setServerError('')

    try {
      const shouldRecordDirectPayment = !!values.direct_payment_enabled && canTakeDirectPayment

      if (saleId) {
        const paymentChanges = buildSalePaymentChangePayloads({
          values,
          exchangeRate: defaultExchangeRateValue,
          exchangeRateId: defaultExchangeRate?.id ?? null,
          saleTotal: totals.total,
          existingPaymentById,
          removedPaymentIds,
          canManageExistingPayments: shouldRecordDirectPayment && canManageExistingPayments,
          canAddPaymentLines: shouldRecordDirectPayment && canAddPaymentLines,
          canDeleteExistingPayments: shouldRecordDirectPayment && canDeleteExistingPayments,
          correctionReason: t('payment.editAction'),
          deletionReason: t('payment.removeLine'),
        })

        const sale = await updateSaleWithPayments.mutateAsync({
          id: saleId,
          payload: {
            ...buildSalePayload(values),
            ...(paymentChanges.paymentDeletions.length > 0
              ? { payment_deletions: paymentChanges.paymentDeletions }
              : {}),
            ...(paymentChanges.paymentCorrections.length > 0
              ? { payment_corrections: paymentChanges.paymentCorrections }
              : {}),
            ...(paymentChanges.payments.length > 0
              ? { payment_date: values.sale_date, payment_note: null, payments: paymentChanges.payments }
              : {}),
          },
        })

        if (paymentChanges.payments.length > 0) {
          enqueueSnackbar(t('messages.updatedAndPaid'), { variant: 'success' })
        } else {
          enqueueSnackbar(t('messages.updated'), { variant: 'success' })
        }
        router.push(`/sales/${sale.id}`)
      } else {
        const directPaymentLines = shouldRecordDirectPayment
          ? buildDirectPaymentLines(values, defaultExchangeRateValue, defaultExchangeRate?.id ?? null, totals.total)
          : []
        const payload = {
          ...buildSalePayload({
            ...values,
            type: isQuotationMode ? 'quotation' : values.type,
          }),
          client_request_id: clientRequestId,
          ...(shouldRecordDirectPayment && directPaymentLines.length > 0
            ? { payment_date: values.sale_date, payment_note: null, payments: directPaymentLines }
            : {}),
        }

        if (isQuotationMode) {
          const quotation = await createQuotation.mutateAsync(payload)

          enqueueSnackbar(t('quotations.messages.created'), { variant: 'success' })
          setClientRequestId(createClientRequestId())
          router.push(`/quotations/${quotation.id}`)
          return
        }

        const sale = await createSale.mutateAsync(payload)
        if (shouldRecordDirectPayment && directPaymentLines.length > 0) {
          enqueueSnackbar(t('messages.createdAndPaid'), { variant: 'success' })
        } else {
          enqueueSnackbar(t('messages.created'), { variant: 'success' })
        }
        setClientRequestId(createClientRequestId())
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
    } finally {
      setIsSubmittingSale(false)
    }
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
            <Typography variant="h4">
              {isQuotationMode ? t('quotations.form.createTitle') : t(isEdit ? 'form.editTitle' : 'form.createTitle')}
            </Typography>
            <InstructionTooltip title={isQuotationMode ? t('quotations.form.subtitle') : t('form.subtitle')} />
          </Stack>
        </Box>
        <Tooltip title={isQuotationMode ? t('quotations.actions.backToQuotations') : t('actions.backToSales')}>
          <IconButton
            size="small"
            aria-label={isQuotationMode ? t('quotations.actions.backToQuotations') : t('actions.backToSales')}
            onClick={() => router.push(isQuotationMode ? '/quotations' : isEdit && saleId ? `/sales/${saleId}` : '/sales')}
          >
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
                {isQuotationMode ? (
                  <TextField label={t('fields.type')} value={t('types.quotation')} disabled />
                ) : (
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} select label={t('fields.type')} error={!!errors.type} helperText={errors.type?.message} required>
                        {saleTypes.map((type) => <MenuItem key={type} value={type}>{t(`types.${type}`)}</MenuItem>)}
                      </TextField>
                    )}
                  />
                )}
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
                            disabled={isSaving || paymentAccounts.length === 0 || !canAddPaymentLines}
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
                              {directPaymentFields.map((field, index) => {
                                const line = watchedDirectPayments[index]
                                const isExistingPaymentLine = !!line?.sale_payment_id
                                const lineDisabled = isSaving
                                  || (isExistingPaymentLine ? !canManageExistingPayments : !canAddPaymentLines)

                                return (
                                  <TableRow key={field.fieldId}>
                                    <TableCell sx={directPaymentColumnSx.account}>
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
                                            disabled={lineDisabled}
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
                                            disabled={lineDisabled}
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
                                            disabled={lineDisabled}
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
                                            disabled={lineDisabled}
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
                                            disabled={isSaving || directPaymentFields.length === 1 || (isExistingPaymentLine && !canDeleteExistingPayments)}
                                            onClick={() => removeDirectPaymentLine(index)}
                                          >
                                            <DeleteOutlined />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
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
                            disabled={isSaving || paymentAccounts.length === 0 || (isEdit && directPaymentRemaining <= 0 && watchedDirectPayments.every((line) => line.sale_payment_id))}
                            onClick={() => {
                              const currentLine = watchedDirectPayments[0]
                              const nextCurrency = currentLine?.payment_currency ?? 'USD'
                              const existingBaseAmount = isEdit
                                ? watchedDirectPayments.reduce((total, line) => (
                                  line.sale_payment_id ? total + directPaymentLineBaseAmount(line, defaultExchangeRateValue) : total
                                ), 0)
                                : 0
                              const targetAmount = isEdit
                                ? Math.max(0, round(editPaymentLimit - existingBaseAmount))
                                : editPaymentLimit
                              const nextAmount = nextCurrency === 'KHR' && defaultExchangeRateValue > 0
                                ? round(targetAmount * defaultExchangeRateValue)
                                : targetAmount
                              const nextLine: DirectPaymentLineInput = {
                                ...newDirectPaymentLine(paymentAccounts),
                                payment_account_id: currentLine?.payment_account_id || paymentAccounts[0]?.id || '',
                                payment_currency: nextCurrency,
                                payment_amount: nextAmount,
                                method: currentLine?.method ?? 'cash',
                                reference: currentLine?.reference ?? '',
                              }

                              if (isEdit) {
                                const firstNewLineIndex = watchedDirectPayments.findIndex((line) => !line.sale_payment_id)
                                const nextPayments = firstNewLineIndex >= 0
                                  ? watchedDirectPayments.map((line, index) => index === firstNewLineIndex ? nextLine : line)
                                  : [...watchedDirectPayments, nextLine]

                                setValue('direct_payments', nextPayments, { shouldDirty: true, shouldValidate: true })
                                return
                              }

                              setValue('direct_payments', [{
                                ...nextLine,
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
            <Button variant="outlined" onClick={() => router.push(isQuotationMode ? '/quotations' : isEdit && saleId ? `/sales/${saleId}` : '/sales')} disabled={isSaving}>
              {t('common:buttons.cancel')}
            </Button>
            <Button type="submit" variant="contained" startIcon={isSaving ? undefined : <SaveOutlined />} disabled={isSaving}>
              {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  )
}
