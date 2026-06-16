'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { useDefaultWarehouseSelection } from '@/features/warehouses/useDefaultWarehouseSelection'
import {
  warehouseProductSettingSchema,
  type WarehouseProductSettingFormInput,
  type WarehouseProductSettingFormValues,
} from './schema'
import type { Product, ProductVariation } from '@/types/product'
import type { RackLocation } from '@/types/rackLocation'
import type { Supplier } from '@/types/supplier'
import type { Warehouse } from '@/types/warehouse'
import type { WarehouseProductSetting, WarehouseProductSettingPayload } from '@/types/warehouseProductSetting'

interface WarehouseProductSettingFormDialogProps {
  open: boolean
  setting: WarehouseProductSetting | null
  warehouses: Warehouse[]
  products: Product[]
  rackLocations: RackLocation[]
  suppliers: Supplier[]
  isLoadingOptions: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: WarehouseProductSettingPayload) => Promise<void>
}

const defaultValues: WarehouseProductSettingFormInput = {
  warehouse_id: '',
  product_id: '',
  variation_id: null,
  rack_location_id: null,
  preferred_supplier_id: null,
  min_stock_alert: '',
  max_stock_level: '',
  reorder_point: '',
  reorder_quantity: '',
  is_active: true,
  notes: '',
}

function settingToFormValues(setting: WarehouseProductSetting | null): WarehouseProductSettingFormInput {
  if (!setting) return defaultValues

  return {
    warehouse_id: setting.warehouse_id,
    product_id: setting.product_id,
    variation_id: setting.variation_id,
    rack_location_id: setting.rack_location_id,
    preferred_supplier_id: setting.preferred_supplier_id,
    min_stock_alert: setting.min_stock_alert ?? '',
    max_stock_level: setting.max_stock_level ?? '',
    reorder_point: setting.reorder_point ?? '',
    reorder_quantity: setting.reorder_quantity ?? '',
    is_active: setting.is_active,
    notes: setting.notes ?? '',
  }
}

function productLabel(product: Product) {
  return [product.name, product.sku].filter(Boolean).join(' / ')
}

function variationLabel(variation: ProductVariation) {
  return [variation.name, variation.sku].filter(Boolean).join(' / ')
}

function warehouseLabel(warehouse: Warehouse) {
  return [warehouse.name, warehouse.code].filter(Boolean).join(' / ')
}

function rackLocationLabel(rackLocation: RackLocation) {
  return [rackLocation.name, rackLocation.code].filter(Boolean).join(' / ')
}

function supplierLabel(supplier: Supplier) {
  return [supplier.name, supplier.phone].filter(Boolean).join(' / ')
}

export function WarehouseProductSettingFormDialog({
  open,
  setting,
  warehouses,
  products,
  rackLocations,
  suppliers,
  isLoadingOptions,
  isSaving,
  onClose,
  onSubmit,
}: WarehouseProductSettingFormDialogProps) {
  const { t } = useTranslation(['warehouseProductSettings', 'common'])
  const [serverError, setServerError] = useState('')
  const values = useMemo(() => settingToFormValues(setting), [setting])
  const title = setting ? t('form.editTitle') : t('form.createTitle')

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<WarehouseProductSettingFormInput, unknown, WarehouseProductSettingFormValues>({
    resolver: zodResolver(warehouseProductSettingSchema),
    defaultValues,
  })

  const warehouseId = useWatch({ control, name: 'warehouse_id' })
  const productId = useWatch({ control, name: 'product_id' })
  const selectedProduct = products.find((product) => product.id === productId) ?? null
  const variationOptions = selectedProduct?.variations ?? []
  const rackLocationOptions = rackLocations.filter((rackLocation) => rackLocation.warehouse_id === warehouseId)

  const selectDefaultWarehouse = useCallback((warehouse: Warehouse) => {
    setValue('warehouse_id', warehouse.id, { shouldDirty: false, shouldValidate: true })
  }, [setValue])

  useDefaultWarehouseSelection({
    warehouses,
    warehouseId,
    onWarehouseChange: selectDefaultWarehouse,
    enabled: open && !setting,
  })

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const closeDialog = () => {
    setServerError('')
    onClose()
  }

  const submitForm = async (formValues: WarehouseProductSettingFormValues) => {
    setServerError('')

    try {
      await onSubmit({
        ...formValues,
        variation_id: formValues.variation_id || null,
        rack_location_id: formValues.rack_location_id || null,
        preferred_supplier_id: formValues.preferred_supplier_id || null,
      })
      closeDialog()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof WarehouseProductSettingFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : closeDialog} fullWidth maxWidth="md">
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            {!isLoadingOptions && warehouses.length === 0 && (
              <Alert severity="warning">{t('messages.noWarehouses')}</Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Controller
                name="warehouse_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={warehouses}
                    value={warehouses.find((warehouse) => warehouse.id === field.value) ?? null}
                    loading={isLoadingOptions}
                    disabled={isLoadingOptions}
                    getOptionLabel={warehouseLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onBlur={field.onBlur}
                    onChange={(_, warehouse) => {
                      field.onChange(warehouse?.id ?? '')
                      setValue('rack_location_id', null, { shouldDirty: true, shouldValidate: true })
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('fields.warehouse')}
                        error={!!errors.warehouse_id}
                        helperText={errors.warehouse_id?.message}
                        required
                      />
                    )}
                  />
                )}
              />

              <Controller
                name="product_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={products}
                    value={products.find((product) => product.id === field.value) ?? null}
                    loading={isLoadingOptions}
                    disabled={isLoadingOptions}
                    getOptionLabel={productLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onBlur={field.onBlur}
                    onChange={(_, product) => {
                      field.onChange(product?.id ?? '')
                      setValue('variation_id', null, { shouldDirty: true, shouldValidate: true })
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('fields.product')}
                        error={!!errors.product_id}
                        helperText={errors.product_id?.message}
                        required
                      />
                    )}
                  />
                )}
              />

              <Controller
                name="variation_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={variationOptions}
                    value={variationOptions.find((variation) => variation.id === field.value) ?? null}
                    disabled={!selectedProduct || variationOptions.length === 0}
                    getOptionLabel={variationLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onBlur={field.onBlur}
                    onChange={(_, variation) => field.onChange(variation?.id ?? null)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('fields.variation')}
                        error={!!errors.variation_id}
                        helperText={errors.variation_id?.message || (selectedProduct && variationOptions.length === 0 ? t('form.noVariations') : undefined)}
                      />
                    )}
                  />
                )}
              />

              <Controller
                name="rack_location_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={rackLocationOptions}
                    value={rackLocationOptions.find((rackLocation) => rackLocation.id === field.value) ?? null}
                    disabled={!warehouseId}
                    getOptionLabel={rackLocationLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onBlur={field.onBlur}
                    onChange={(_, rackLocation) => field.onChange(rackLocation?.id ?? null)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('fields.rackLocation')}
                        error={!!errors.rack_location_id}
                        helperText={errors.rack_location_id?.message}
                      />
                    )}
                  />
                )}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
              {(['min_stock_alert', 'max_stock_level', 'reorder_point', 'reorder_quantity'] as const).map((name) => (
                <Controller
                  key={name}
                  name={name}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      type="number"
                      label={t(`fields.${name}`)}
                      error={!!errors[name]}
                      helperText={errors[name]?.message}
                      slotProps={{ htmlInput: { min: 0, step: 0.0001 } }}
                    />
                  )}
                />
              ))}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Controller
                name="preferred_supplier_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={suppliers}
                    value={suppliers.find((supplier) => supplier.id === field.value) ?? null}
                    loading={isLoadingOptions}
                    getOptionLabel={supplierLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onBlur={field.onBlur}
                    onChange={(_, supplier) => field.onChange(supplier?.id ?? null)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('fields.preferredSupplier')}
                        error={!!errors.preferred_supplier_id}
                        helperText={errors.preferred_supplier_id?.message}
                      />
                    )}
                  />
                )}
              />

              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                    label={t('fields.isActive')}
                    sx={{ alignSelf: 'center' }}
                  />
                )}
              />
            </Box>

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('fields.notes')}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                  multiline
                  minRows={3}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving || warehouses.length === 0 || products.length === 0}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
