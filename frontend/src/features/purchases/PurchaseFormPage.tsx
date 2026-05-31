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
  FormHelperText,
  IconButton,
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
import { Add, ArrowBack, DeleteOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { UnitConversionBadge } from '@/features/sales/components/UnitConversionBadge'
import { InventoryProductLookupPicker } from '@/features/inventory/components/InventoryProductLookupPicker'
import { SupplierFormDialog } from '@/features/suppliers/SupplierFormDialog'
import { useCreateSupplierMutation, useSuppliersQuery } from '@/features/suppliers/hooks'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { useCustomFieldsQuery } from '@/features/custom-fields/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { InventoryProductLookupItem } from '@/types/inventory'
import { useCreatePurchaseMutation, usePurchaseQuery, useUpdatePurchaseMutation } from './hooks'
import { buildPurchasePayload, emptyPurchaseValues, valuesFromPurchase } from './formHelpers'
import { purchaseSchema, type PurchaseFormInput, type PurchaseFormValues } from './schema'
import type { Supplier, SupplierPayload } from '@/types/supplier'
import type { Warehouse } from '@/types/warehouse'
import type { TaxRate } from '@/types/taxRate'
import { useTaxRatesQuery } from '@/features/tax-rates/hooks'

interface PurchaseFormPageProps {
  purchaseId?: string
}

function warehouseLabel(warehouse: Warehouse) {
  return [warehouse.name, warehouse.code, warehouse.branch?.name].filter(Boolean).join(' / ')
}

function supplierLabel(supplier: Supplier) {
  return [supplier.name, supplier.code, supplier.company].filter(Boolean).join(' / ')
}

const discountTypes = ['fixed', 'percentage'] as const

function taxRateLabel(rate: TaxRate) {
  return `${rate.name} (${rate.rate}${rate.type === 'percentage' ? '%' : ''})`
}

function discountAmount(type: string | null | undefined, amount: unknown, base: number) {
  const value = Number(amount) || 0
  if (type === 'percentage') return Math.min(base, base * value / 100)
  if (type === 'fixed') return Math.min(base, value)
  return value
}

export function PurchaseFormPage({ purchaseId }: PurchaseFormPageProps) {
  const { t } = useTranslation(['purchases', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [createdSupplier, setCreatedSupplier] = useState<Supplier | null>(null)
  const isEdit = !!purchaseId

  const purchaseQuery = usePurchaseQuery(purchaseId ?? null)
  const warehousesQuery = useWarehousesQuery({ per_page: 100 })
  const suppliersQuery = useSuppliersQuery({ per_page: 100 })
  const createPurchase = useCreatePurchaseMutation()
  const updatePurchase = useUpdatePurchaseMutation()
  const isSaving = isSubmitting || createPurchase.isPending || updatePurchase.isPending

  const can = useAuthStore((state) => state.can)
  const createSupplier = useCreateSupplierMutation()
  const supplierCustomFieldsQuery = useCustomFieldsQuery({ module: 'supplier', per_page: 100 })

  const taxRatesQuery = useTaxRatesQuery({ is_active: true, per_page: 100 })
  const taxRates = taxRatesQuery.data?.data ?? []

  const applyTaxRate = (index: number, taxRateId: string) => {
    const taxRate = taxRates.find((item) => item.id === taxRateId)
    setValue(`items.${index}.tax_rate_id`, taxRateId)
    setValue(`items.${index}.tax_rate_type`, taxRate?.type ?? null)
    setValue(`items.${index}.tax_rate`, taxRate?.rate ?? 0)
  }

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<PurchaseFormInput, unknown, PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: emptyPurchaseValues(),
  })

  const { fields: itemFields, append, remove } = useFieldArray({ control, name: 'items', keyName: 'fieldId' })

  const warehouseId = useWatch({ control, name: 'warehouse_id' })
  const taxScope = useWatch({ control, name: 'tax_scope' })
  const saleTaxRate = useWatch({ control, name: 'tax_rate' })
  const watchedItemsValue = useWatch({ control, name: 'items' })
  const watchedItems = useMemo(() => watchedItemsValue ?? [], [watchedItemsValue])
  const warehouses = useMemo(() => warehousesQuery.data?.data ?? [], [warehousesQuery.data?.data])

  const supplierCustomFields = useMemo(
    () => [...(supplierCustomFieldsQuery.data?.data ?? [])].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      return a.field_label.localeCompare(b.field_label)
    }),
    [supplierCustomFieldsQuery.data?.data],
  )
  const canCreateSupplier = can('suppliers.create')
  const suppliers = useMemo(() => {
    const baseSuppliers = suppliersQuery.data?.data ?? []
    if (!createdSupplier || baseSuppliers.some((s) => s.id === createdSupplier.id)) {
      return baseSuppliers
    }
    return [createdSupplier, ...baseSuppliers]
  }, [createdSupplier, suppliersQuery.data?.data])

  const totals = useMemo(() => {
    let subtotal = 0
    let itemTax = 0
    for (const item of watchedItems) {
      const qty = Number(item.quantity) || 0
      const cost = Number(item.unit_cost) || 0
      const gross = Math.round(qty * cost * 100) / 100
      const disc = discountAmount(item.discount_type, item.discount_amount, gross)
      const afterDiscount = Math.max(0, gross - disc)
      subtotal += afterDiscount
      if (taxScope !== 'sale') {
        const rate = Number(item.tax_rate) || 0
        itemTax += Math.max(0, afterDiscount * rate / 100)
      }
    }
    const shipping = 0
    if (taxScope === 'sale') {
      const rate = Number(saleTaxRate) || 0
      itemTax = subtotal * rate / 100
    }
    return { subtotal, tax: itemTax, shipping, total: subtotal + itemTax + shipping }
  }, [watchedItems, taxScope, saleTaxRate])
  const lineCalculations = useMemo(
    () => watchedItems.map((item) => {
      const qty = Number(item.quantity) || 0
      const cost = Number(item.unit_cost) || 0
      const discount = Number(item.discount_amount) || 0
      const rate = Number(item.tax_rate) || 0
      const lineSubtotal = qty * cost
      const lineDiscounted = Math.max(0, lineSubtotal - discount)
      const lineTax = lineDiscounted * rate / 100
      const lineTotal = lineDiscounted + lineTax
      return { lineSubtotal, lineDiscounted, lineTax, lineTotal }
    }),
    [watchedItems],
  )

  useEffect(() => {
    if (purchaseQuery.data) reset(valuesFromPurchase(purchaseQuery.data))
  }, [reset, purchaseQuery.data])

  useEffect(() => {
    const selectedWarehouse = warehouses.find((w) => w.id === warehouseId)
    if (selectedWarehouse?.branch_id) {
      setValue('branch_id', selectedWarehouse.branch_id, { shouldDirty: true })
    }
  }, [warehouseId, warehouses, setValue])

  const addLookupItem = (item: InventoryProductLookupItem) => {
    append({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      product_label: item.label,
      sku: item.sku ?? null,
      unit_id: item.unit?.id ?? null,
      unit_name: item.unit?.short_name ?? item.unit?.name ?? null,
      sub_unit_id: item.sub_unit?.id ?? null,
      unit_label: item.sub_unit?.short_name ?? item.sub_unit?.name ?? item.unit?.short_name ?? item.unit?.name ?? null,
      has_sub_unit: !!item.sub_unit,
      _default_sub_unit_id: item.sub_unit?.id ?? null,
      conversion_factor: item.sub_unit?.conversion_factor ?? null,
      stock_tracking: item.stock_tracking ?? 'none',
      quantity: 1,
      unit_cost: Number(item.unit_cost) || 0,
      discount_type: null,
      discount_amount: 0,
      tax_rate_id: null,
      tax_rate_type: null,
      tax_rate: 0,
      tax_type: null,
      notes: null,
    })
  }

  const handleCreateSupplier = async (payload: SupplierPayload) => {
    const supplier = await createSupplier.mutateAsync(payload)
    setCreatedSupplier(supplier)
    setValue('supplier_id', supplier.id, { shouldDirty: true, shouldValidate: true })
    enqueueSnackbar(t('suppliers:messages.created', { defaultValue: 'Supplier created successfully' }), { variant: 'success' })
    setSupplierDialogOpen(false)
  }

  const submitForm = async (values: PurchaseFormValues) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setServerError('')

    try {
      const payload = buildPurchasePayload(values)

      if (purchaseId) {
        const purchase = await updatePurchase.mutateAsync({ id: purchaseId, payload })
        enqueueSnackbar(t('messages.updated'), { variant: 'success' })
        router.push(`/purchases/${purchase.id}`)
      } else {
        const purchase = await createPurchase.mutateAsync(payload)
        enqueueSnackbar(t('messages.created'), { variant: 'success' })
        router.push(`/purchases/${purchase.id}`)
      }
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof PurchaseFormInput, { type: 'server', message: messages[0] })
        })
      }
      setServerError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEdit && purchaseQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          {t(isEdit ? 'form.edit' : 'form.create')}
        </Typography>
        <Tooltip title={t('detail.back')}>
          <IconButton
            size="small"
            onClick={() => router.push(purchaseId ? `/purchases/${purchaseId}` : '/purchases')}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>
      </Stack>

      {purchaseQuery.isError && <Alert severity="error">{toAppApiError(purchaseQuery.error).message}</Alert>}

      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <Stack spacing={3}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Card variant="outlined">
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Stack spacing={2.5}>
                <Typography variant="subtitle2">{t('form.orderDetails')}</Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  <Controller
                    name="warehouse_id"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        options={warehouses}
                        value={warehouses.find((w) => w.id === field.value) ?? null}
                        loading={warehousesQuery.isLoading}
                        getOptionLabel={warehouseLabel}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        onBlur={field.onBlur}
                        onChange={(_, w) => {
                          field.onChange(w?.id ?? '')
                          if (w?.branch_id) {
                            setValue('branch_id', w.branch_id, { shouldDirty: true })
                          }
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
                            label={t('form.warehouse')}
                            error={!!errors.warehouse_id || !!errors.branch_id}
                            helperText={errors.warehouse_id?.message || errors.branch_id?.message}
                            required
                          />
                        )}
                      />
                    )}
                  />
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                    <Controller
                      name="supplier_id"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          options={suppliers}
                          value={suppliers.find((s) => s.id === field.value) ?? null}
                          loading={suppliersQuery.isLoading}
                          getOptionLabel={supplierLabel}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          onBlur={field.onBlur}
                          onChange={(_, s) => field.onChange(s?.id ?? '')}
                          sx={{ flexGrow: 1 }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={t('form.supplier')}
                              error={!!errors.supplier_id}
                              helperText={errors.supplier_id?.message}
                              required
                            />
                          )}
                        />
                      )}
                    />
                    {canCreateSupplier && (
                      <Tooltip title={t('common:buttons.create')}>
                        <IconButton
                          aria-label={t('common:buttons.create')}
                          size="small"
                          color="primary"
                          onClick={() => setSupplierDialogOpen(true)}
                          sx={{
                            width: 'var(--app-control-height)',
                            height: 'var(--app-control-height)',
                            minWidth: 'var(--app-control-height)',
                            minHeight: 'var(--app-control-height)',
                            border: 1,
                            borderColor: 'divider',
                            flex: '0 0 auto',
                          }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                  <Controller
                    name="purchase_date"
                    control={control}
                    render={({ field }) => (
                      <AppDatePicker
                        label={t('form.purchaseDate')}
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? '')}
                        error={!!errors.purchase_date}
                        helperText={errors.purchase_date?.message}
                        required
                      />
                    )}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  <Controller
                    name="supplier_invoice_no"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        label={t('form.supplierInvoiceNo')}
                        error={!!errors.supplier_invoice_no}
                        helperText={errors.supplier_invoice_no?.message}
                      />
                    )}
                  />
                  <Controller
                    name="expected_date"
                    control={control}
                    render={({ field }) => (
                      <AppDatePicker
                        label={t('form.expectedDate')}
                        value={field.value ?? ''}
                        onChange={(v) => field.onChange(v ?? null)}
                        error={!!errors.expected_date}
                        helperText={errors.expected_date?.message}
                      />
                    )}
                  />
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} select label={t('form.status')} error={!!errors.status} helperText={errors.status?.message}>
                        <MenuItem value="draft">{t('form.draftOption')}</MenuItem>
                        <MenuItem value="confirmed">{t('form.confirmedOption')}</MenuItem>
                      </TextField>
                    )}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Stack spacing={2.5}>
                <Typography variant="subtitle2">{t('form.items')}</Typography>

                <InventoryProductLookupPicker
                  warehouseId={warehouseId || undefined}
                  disabled={!warehouseId || isSaving}
                  onSelect={addLookupItem}
                />

                {typeof errors.items?.message === 'string' && <Alert severity="error">{errors.items.message}</Alert>}

                <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 1300, tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 260, minWidth: 260 }}>{t('form.product')}</TableCell>
                        <TableCell sx={{ width: 110, minWidth: 110 }} align="right">{t('form.quantity')}</TableCell>
                        <TableCell sx={{ width: 110, minWidth: 110 }}>{t('form.subUnit')}</TableCell>
                        <TableCell sx={{ width: 140, minWidth: 140 }} align="right">{t('form.unitCost')}</TableCell>
                        <TableCell sx={{ width: 140, minWidth: 140 }}>{t('form.discountType')}</TableCell>
                        <TableCell sx={{ width: 120, minWidth: 120 }} align="right">{t('form.discountAmount')}</TableCell>
                        <TableCell sx={{ width: 150, minWidth: 150 }}>{t('form.tax')}</TableCell>
                        <TableCell sx={{ width: 120, minWidth: 120 }} align="right">{t('form.subtotal')}</TableCell>
                        <TableCell sx={{ width: 72, minWidth: 72 }} align="center">{t('common:buttons.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {itemFields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {t('empty')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                      {itemFields.map((field, index) => {
                        const calc = lineCalculations[index] ?? { lineSubtotal: 0, lineDiscounted: 0, lineTax: 0, lineTotal: 0 }

                        return (
                          <TableRow key={field.fieldId}>
                            <TableCell>
                              <Stack spacing={0.25}>
                                <Typography variant="body2">{field.product_label || '-'}</Typography>
                                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {field.sku || '-'}
                                  </Typography>
                                  {watchedItems[index]?.sub_unit_id && watchedItems[index]?.conversion_factor ? (
                                    <UnitConversionBadge
                                      conversionFactor={watchedItems[index].conversion_factor}
                                      baseUnitLabel={field.unit_name ?? ''}
                                      subUnitLabel={field.unit_label ?? ''}
                                      quantity={Number(watchedItems[index]?.quantity ?? 0)}
                                    />
                                  ) : field.unit_name ? (
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      · {field.unit_name}
                                    </Typography>
                                  ) : null}
                                </Stack>
                                {field.stock_tracking && field.stock_tracking !== 'none' && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {field.stock_tracking}
                                  </Typography>
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Controller
                                name={`items.${index}.quantity`}
                                control={control}
                                render={({ field: f }) => (
                                  <TextField {...f} fullWidth type="number" error={!!errors.items?.[index]?.quantity} helperText={errors.items?.[index]?.quantity?.message} required slotProps={{ htmlInput: { min: 0.0001, step: 0.0001 } }} />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              {watchedItems[index]?._default_sub_unit_id ? (
                                <Select
                                  fullWidth
                                  value={watchedItems[index]?.sub_unit_id ?? '__none__'}
                                  onChange={(e) => {
                                    const val = e.target.value === '__none__' ? null : e.target.value
                                    setValue(`items.${index}.sub_unit_id`, val)
                                    if (val) {
                                      setValue(`items.${index}.unit_label`, watchedItems[index]?.unit_label || field.unit_name)
                                    }
                                  }}
                                >
                                  <MenuItem value="__none__">
                                    {watchedItems[index]?.unit_name ?? t('form.noSubUnit')}
                                  </MenuItem>
                                  <MenuItem value={watchedItems[index]?._default_sub_unit_id ?? ''}>
                                    {watchedItems[index]?.unit_label || t('form.subUnit')}
                                  </MenuItem>
                                </Select>
                              ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  —
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Controller
                                name={`items.${index}.unit_cost`}
                                control={control}
                                render={({ field: f }) => (
                                  <TextField {...f} fullWidth type="number" error={!!errors.items?.[index]?.unit_cost} helperText={errors.items?.[index]?.unit_cost?.message} required slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller name={`items.${index}.discount_type`} control={control} render={({ field: f }) => (
                                <TextField {...f} fullWidth value={f.value ?? ''} select>
                                  <MenuItem value="">{t('form.noDiscount')}</MenuItem>
                                  {discountTypes.map((type) => <MenuItem key={type} value={type}>{t(`discountTypes.${type}`)}</MenuItem>)}
                                </TextField>
                              )} />
                            </TableCell>
                            <TableCell align="right">
                              <Controller name={`items.${index}.discount_amount`} control={control} render={({ field: f }) => (
                                <TextField {...f} fullWidth value={f.value ?? ''} type="number" slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
                              )} />
                            </TableCell>
                            <TableCell>
                              <Controller name={`items.${index}.tax_rate_id`} control={control} render={({ field: f }) => (
                                <Autocomplete
                                  fullWidth
                                  options={taxRates}
                                  value={taxRates.find((rate) => rate.id === f.value) ?? null}
                                  loading={taxRatesQuery.isLoading}
                                  getOptionLabel={taxRateLabel}
                                  isOptionEqualToValue={(option, value) => option.id === value.id}
                                  disabled={taxScope === 'sale'}
                                  onBlur={f.onBlur}
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
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {calc.lineTotal.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" disabled={isSaving} onClick={() => remove(index)}>
                                <DeleteOutlined />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Stack spacing={2.5}>
                <Typography variant="subtitle2">{t('form.pricing')}</Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                  <Controller name="discount_type" control={control} render={({ field }) => (
                    <TextField {...field} value={field.value ?? ''} select label={t('form.discountType')} error={!!errors.discount_type} helperText={errors.discount_type?.message}>
                      <MenuItem value="">{t('form.noDiscount')}</MenuItem>
                      {discountTypes.map((type) => <MenuItem key={type} value={type}>{t(`discountTypes.${type}`)}</MenuItem>)}
                    </TextField>
                  )} />
                  <Controller
                    name="discount_amount"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        type="number"
                        label={t('form.discount')}
                        error={!!errors.discount_amount}
                        helperText={errors.discount_amount?.message}
                        slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                      />
                    )}
                  />
                  <Controller
                    name="shipping_charges"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        type="number"
                        label={t('form.shipping')}
                        error={!!errors.shipping_charges}
                        helperText={errors.shipping_charges?.message}
                        slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                      />
                    )}
                  />
                  <FormControl error={!!errors.tax_scope}>
                    <InputLabel id="purchase-tax-scope-label">{t('form.taxScope')}</InputLabel>
                    <Controller name="tax_scope" control={control} render={({ field }) => (
                      <Select {...field} labelId="purchase-tax-scope-label" label={t('form.taxScope')}>
                        <MenuItem value="line">{t('form.taxScopeLine')}</MenuItem>
                        <MenuItem value="sale">{t('form.taxScopeSale')}</MenuItem>
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
                            label={t('form.tax')}
                            error={!!errors.tax_rate_id}
                            helperText={errors.tax_rate_id?.message || t('form.noTax')}
                          />
                        )}
                      />
                    )} />
                  </Box>
                )}

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.subtotal')}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{totals.subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.taxAmount')}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{totals.tax.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.shippingAmount')}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{totals.shipping.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.total')}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{totals.total.toFixed(2)}</Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Stack spacing={2.5}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        label={t('form.notes')}
                        multiline
                        minRows={2}
                        error={!!errors.notes}
                        helperText={errors.notes?.message}
                      />
                    )}
                  />
                  <Controller
                    name="staff_note"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        label={t('form.staffNote')}
                        multiline
                        minRows={2}
                        error={!!errors.staff_note}
                        helperText={errors.staff_note?.message}
                      />
                    )}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => router.push(purchaseId ? `/purchases/${purchaseId}` : '/purchases')}
              disabled={isSaving}
            >
              {t('common:buttons.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={18} /> : undefined}
            >
              {t(isEdit ? 'common:buttons.save' : 'common:buttons.create')}
            </Button>
          </Box>
        </Stack>
      </Box>

      <SupplierFormDialog
        key={supplierDialogOpen ? 'purchase-supplier-open' : 'purchase-supplier-closed'}
        open={supplierDialogOpen}
        supplier={null}
        customFields={supplierCustomFields}
        isLoadingCustomFields={supplierCustomFieldsQuery.isLoading}
        isSaving={createSupplier.isPending}
        onClose={() => setSupplierDialogOpen(false)}
        onSubmit={handleCreateSupplier}
      />
    </Stack>
  )
}
