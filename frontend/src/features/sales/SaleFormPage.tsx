'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
  Tooltip,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import { ArrowBack, DeleteOutlined, SaveOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useCustomersQuery } from '@/features/customers/hooks'
import { InventoryProductLookupPicker } from '@/features/inventory/components/InventoryProductLookupPicker'
import { usePriceGroupsQuery } from '@/features/price-groups/hooks'
import { useAppCurrency, useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useTaxRatesQuery } from '@/features/tax-rates/hooks'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { useCreateSaleMutation, useSaleQuery, useUpdateSaleMutation } from './hooks'
import { saleFormSchema, type SaleFormInput, type SaleFormValues } from './schema'
import type { InventoryProductLookupItem } from '@/types/inventory'
import type { Sale, SaleItem, SalePayload } from '@/types/sales'

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

const saleTypes = ['invoice', 'pos_sale', 'draft', 'suspended', 'quotation'] as const
const discountTypes = ['fixed', 'percentage'] as const
const taxScopes = ['line', 'sale'] as const
const taxTypes = ['exclusive', 'inclusive'] as const

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

function lineTotal(item: SaleFormInput['items'][number], taxScope: string) {
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
  const { t } = useTranslation(['sales', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const [serverError, setServerError] = useState('')
  const isEdit = !!saleId
  const currency = useAppCurrency()
  const currencyFormatter = useCurrencyFormatter()

  const saleQuery = useSaleQuery(saleId ?? null)
  const branchesQuery = useBranchesQuery({ is_active: true, per_page: 100 })
  const customersQuery = useCustomersQuery({ status: 'active', per_page: 100 })
  const priceGroupsQuery = usePriceGroupsQuery({ per_page: 100 })
  const taxRatesQuery = useTaxRatesQuery({ is_active: true, per_page: 100 })
  const createSale = useCreateSaleMutation()
  const updateSale = useUpdateSaleMutation()
  const isSaving = createSale.isPending || updateSale.isPending

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

  const { fields, append, remove } = useFieldArray({ control, name: 'items', keyName: 'fieldId' })
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
  const warehousesQuery = useWarehousesQuery({ branch_id: branchId || undefined, per_page: 100 })

  const branches = branchesQuery.data?.data ?? []
  const warehouses = warehousesQuery.data?.data ?? []
  const customers = customersQuery.data?.data ?? []
  const priceGroups = priceGroupsQuery.data?.data ?? []
  const taxRates = taxRatesQuery.data?.data ?? []

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

  useEffect(() => {
    if (saleQuery.data) reset(valuesFromSale(saleQuery.data))
  }, [reset, saleQuery.data])

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
        const sale = await updateSale.mutateAsync({ id: saleId, payload: buildPayload(values) })
        enqueueSnackbar(t('messages.updated'), { variant: 'success' })
        router.push(`/sales/${sale.id}`)
      } else {
        const sale = await createSale.mutateAsync(buildPayload(values))
        enqueueSnackbar(t('messages.created'), { variant: 'success' })
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
          <Typography variant="h4">{t(isEdit ? 'form.editTitle' : 'form.createTitle')}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('form.subtitle')}
          </Typography>
        </Box>
        <Tooltip title={t('actions.backToSales')}>
          <IconButton size="small" aria-label={t('actions.backToSales')} onClick={() => router.push(isEdit && saleId ? `/sales/${saleId}` : '/sales')}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
      </Stack>

      {saleQuery.isError && <Alert severity="error">{toAppApiError(saleQuery.error).message}</Alert>}

      <Card>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
            <Stack spacing={2.5}>
              {serverError && <Alert severity="error">{serverError}</Alert>}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 180px' }, gap: 2 }}>
                <Controller
                  name="branch_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label={t('fields.branch')}
                      error={!!errors.branch_id}
                      helperText={errors.branch_id?.message}
                      required
                      onChange={(event) => {
                        field.onChange(event)
                        setValue('warehouse_id', '')
                      }}
                    >
                      {branches.map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>)}
                    </TextField>
                  )}
                />
                <Controller
                  name="warehouse_id"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label={t('fields.warehouse')} error={!!errors.warehouse_id} helperText={errors.warehouse_id?.message} required>
                      {warehouses.map((warehouse) => <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>)}
                    </TextField>
                  )}
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

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                <Controller
                  name="customer_id"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} value={field.value ?? ''} select label={t('fields.customer')} error={!!errors.customer_id} helperText={errors.customer_id?.message}>
                      <MenuItem value="">{t('labels.walkInCustomer')}</MenuItem>
                      {customers.map((customer) => <MenuItem key={customer.id} value={customer.id}>{customer.name}</MenuItem>)}
                    </TextField>
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
                <Controller
                  name="price_group_id"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} value={field.value ?? ''} select label={t('fields.priceGroup')} error={!!errors.price_group_id} helperText={errors.price_group_id?.message}>
                      <MenuItem value="">{t('form.noPriceGroup')}</MenuItem>
                      {priceGroups.map((group) => <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Box>

              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="subtitle2">{t('form.items')}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('form.itemsHelp')}</Typography>
                </Box>
                <InventoryProductLookupPicker
                  warehouseId={warehouseId || undefined}
                  disabled={!warehouseId || isSaving}
                  helperText={warehouseId ? t('form.pickerHelp') : t('form.selectWarehouseFirst')}
                  onSelect={addLookupItem}
                />
                {typeof errors.items?.message === 'string' && <Alert severity="error">{errors.items.message}</Alert>}

                <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 1460, tableLayout: 'fixed' }}>
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
                      {fields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('form.emptyItems')}</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                      {fields.map((field, index) => (
                        <TableRow key={field.fieldId}>
                          <TableCell sx={itemColumnSx.product}>
                            <Stack spacing={0.25}>
                              <Typography variant="body2">{field.product_label || field.product_id}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {[field.sku, field.lot_number, field.serial_number, field.unit_label].filter(Boolean).join(' / ') || '-'}
                              </Typography>
                              {field.available_quantity !== undefined && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {t('form.available', { quantity: field.available_quantity ?? '-' })}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={itemColumnSx.quantity}>
                            <Controller name={`items.${index}.quantity`} control={control} render={({ field }) => (
                              <TextField {...field} size="small" type="number" error={!!errors.items?.[index]?.quantity} helperText={errors.items?.[index]?.quantity?.message} required slotProps={{ htmlInput: { min: 0.0001, step: 0.0001 } }} />
                            )} />
                          </TableCell>
                          <TableCell align="right" sx={itemColumnSx.price}>
                            <Controller name={`items.${index}.unit_price`} control={control} render={({ field }) => (
                              <TextField {...field} size="small" type="number" error={!!errors.items?.[index]?.unit_price} helperText={errors.items?.[index]?.unit_price?.message} required slotProps={{ htmlInput: { min: 0, step: 0.01 }, input: { startAdornment: <InputAdornment position="start">{currency}</InputAdornment> } }} />
                            )} />
                          </TableCell>
                          <TableCell sx={itemColumnSx.discountType}>
                            <Controller name={`items.${index}.discount_type`} control={control} render={({ field }) => (
                              <TextField {...field} value={field.value ?? ''} size="small" select error={!!errors.items?.[index]?.discount_type} helperText={errors.items?.[index]?.discount_type?.message}>
                                <MenuItem value="">{t('form.noDiscount')}</MenuItem>
                                {discountTypes.map((type) => <MenuItem key={type} value={type}>{t(`discountTypes.${type}`)}</MenuItem>)}
                              </TextField>
                            )} />
                          </TableCell>
                          <TableCell align="right" sx={itemColumnSx.discount}>
                            <Controller name={`items.${index}.discount_amount`} control={control} render={({ field }) => (
                              <TextField {...field} value={field.value ?? ''} size="small" type="number" error={!!errors.items?.[index]?.discount_amount} helperText={errors.items?.[index]?.discount_amount?.message} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                            )} />
                          </TableCell>
                          <TableCell sx={itemColumnSx.tax}>
                            <Controller name={`items.${index}.tax_rate_id`} control={control} render={({ field }) => (
                              <TextField
                                {...field}
                                value={field.value ?? ''}
                                size="small"
                                select
                                disabled={taxScope !== 'line'}
                                error={!!errors.items?.[index]?.tax_rate_id}
                                helperText={errors.items?.[index]?.tax_rate_id?.message}
                                onChange={(event) => applyTaxRate(index, event.target.value)}
                              >
                                <MenuItem value="">{t('form.noTax')}</MenuItem>
                                {taxRates.map((rate) => <MenuItem key={rate.id} value={rate.id}>{rate.name}</MenuItem>)}
                              </TextField>
                            )} />
                          </TableCell>
                          <TableCell sx={itemColumnSx.notes}>
                            <Controller name={`items.${index}.notes`} control={control} render={({ field }) => (
                              <TextField {...field} value={field.value ?? ''} size="small" error={!!errors.items?.[index]?.notes} helperText={errors.items?.[index]?.notes?.message} />
                            )} />
                          </TableCell>
                          <TableCell align="right" sx={itemColumnSx.total}>{currencyFormatter.format(lineTotal(watchedItems[index], taxScope))}</TableCell>
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
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      select
                      label={t('fields.tax')}
                      error={!!errors.tax_rate_id}
                      helperText={errors.tax_rate_id?.message}
                      onChange={(event) => {
                        const taxRate = taxRates.find((item) => item.id === event.target.value)
                        field.onChange(event)
                        setValue('tax_rate_type', taxRate?.type ?? null)
                        setValue('tax_rate', taxRate?.rate ?? 0)
                      }}
                    >
                      <MenuItem value="">{t('form.noTax')}</MenuItem>
                      {taxRates.map((rate) => <MenuItem key={rate.id} value={rate.id}>{rate.name}</MenuItem>)}
                    </TextField>
                  )} />
                  <Controller name="tax_type" control={control} render={({ field }) => (
                    <TextField {...field} value={field.value ?? 'exclusive'} select label={t('fields.taxType')} error={!!errors.tax_type} helperText={errors.tax_type?.message}>
                      {taxTypes.map((type) => <MenuItem key={type} value={type}>{t(`taxTypes.${type}`)}</MenuItem>)}
                    </TextField>
                  )} />
                </Box>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Controller name="notes" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={t('fields.notes')} error={!!errors.notes} helperText={errors.notes?.message} multiline minRows={3} />
                )} />
                <Controller name="staff_note" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={t('fields.staffNote')} error={!!errors.staff_note} helperText={errors.staff_note?.message} multiline minRows={3} />
                )} />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
                {[
                  ['subtotal', totals.subtotal],
                  ['discount', totals.discount],
                  ['tax', totals.tax],
                  ['shipping', totals.shipping],
                  ['total', totals.total],
                ].map(([key, value]) => (
                  <Box key={key}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t(`fields.${key}`)}</Typography>
                    <Typography variant="subtitle1">{currencyFormatter.format(Number(value))}</Typography>
                  </Box>
                ))}
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
        </CardContent>
      </Card>
    </Stack>
  )
}
