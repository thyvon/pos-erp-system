'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
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
  IconButton,
  MenuItem,
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
import { DeleteOutlined } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { InventoryProductLookupPicker } from './components/InventoryProductLookupPicker'
import {
  stockAdjustmentSchema,
  type StockAdjustmentFormInput,
  type StockAdjustmentFormValues,
} from './schema'
import type {
  InventoryProductLookupItem,
  InventoryWarehouseOption,
  StockAdjustment,
  StockAdjustmentItem,
  StockAdjustmentPayload,
} from '@/types/inventory'

interface StockAdjustmentFormDialogProps {
  open: boolean
  warehouses: InventoryWarehouseOption[]
  adjustment?: StockAdjustment | null
  isLoadingOptions: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: StockAdjustmentPayload) => Promise<void>
}

const today = () => new Date().toISOString().slice(0, 10)

const getDefaultValues = (): StockAdjustmentFormInput => ({
  warehouse_id: '',
  date: today(),
  reason: '',
  notes: '',
  items: [],
})

function toNumber(value: string | number | null | undefined, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function getItemLabel(item: StockAdjustmentItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function warehouseLabel(warehouse: InventoryWarehouseOption) {
  return [warehouse.name, warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')
}

function getAdjustmentValues(adjustment: StockAdjustment | null | undefined): StockAdjustmentFormInput {
  if (!adjustment) return getDefaultValues()

  return {
    warehouse_id: adjustment.warehouse_id,
    date: adjustment.date,
    reason: adjustment.reason ?? '',
    notes: adjustment.notes ?? '',
    items: adjustment.items.map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      lot_id: item.lot_id ?? null,
      serial_id: item.serial_id ?? null,
      product_label: getItemLabel(item),
      sku: item.variation?.sku ?? item.product?.sku ?? null,
      lot_number: item.lot?.lot_number ?? null,
      serial_number: item.serial?.serial_number ?? null,
      available_quantity: null,
      direction: item.direction,
      quantity: toNumber(item.quantity, 1),
      unit_cost: toNumber(item.unit_cost),
      notes: item.notes ?? '',
    })),
  }
}

function buildPayload(values: StockAdjustmentFormValues): StockAdjustmentPayload {
  return {
    warehouse_id: values.warehouse_id,
    date: values.date,
    reason: values.reason ?? null,
    notes: values.notes ?? null,
    items: values.items.map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      lot_id: item.lot_id ?? null,
      serial_id: item.serial_id ?? null,
      direction: item.direction,
      quantity: item.quantity,
      unit_cost: item.unit_cost ?? 0,
      notes: item.notes ?? null,
    })),
  }
}

export function StockAdjustmentFormDialog({
  open,
  warehouses,
  adjustment,
  isLoadingOptions,
  isSaving,
  onClose,
  onSubmit,
}: StockAdjustmentFormDialogProps) {
  const { t } = useTranslation(['inventory', 'common'])
  const [serverError, setServerError] = useState('')

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StockAdjustmentFormInput, unknown, StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: getDefaultValues(),
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
    keyName: 'fieldId',
  })

  const warehouseId = useWatch({ control, name: 'warehouse_id' })
  const warehouseOptions = useMemo(() => warehouses, [warehouses])
  const isEdit = !!adjustment

  useEffect(() => {
    if (open) {
      reset(getAdjustmentValues(adjustment))
    }
  }, [adjustment, open, reset])

  const addLookupItem = (item: InventoryProductLookupItem) => {
    append({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      lot_id: item.lot_id ?? null,
      serial_id: item.serial_id ?? null,
      product_label: item.label,
      sku: item.sku ?? null,
      lot_number: item.lot_number ?? null,
      serial_number: item.serial_number ?? null,
      available_quantity: item.available_quantity ?? null,
      direction: 'in',
      quantity: 1,
      unit_cost: item.unit_cost ? Number(item.unit_cost) : 0,
      notes: '',
    })
  }

  const submitForm = async (values: StockAdjustmentFormValues) => {
    setServerError('')

    try {
      await onSubmit(buildPayload(values))
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof StockAdjustmentFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="lg">
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <DialogTitle>{t(isEdit ? 'adjustments.form.editTitle' : 'adjustments.form.createTitle')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            {!isLoadingOptions && warehouseOptions.length === 0 && (
              <Alert severity="warning">{t('adjustments.messages.noWarehouses')}</Alert>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 220px' },
                gap: 2,
              }}
            >
              <Controller
                name="warehouse_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={warehouseOptions}
                    value={warehouseOptions.find((warehouse) => warehouse.id === field.value) ?? null}
                    loading={isLoadingOptions}
                    getOptionLabel={warehouseLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    disabled={isLoadingOptions}
                    onBlur={field.onBlur}
                    onChange={(_, warehouse) => field.onChange(warehouse?.id ?? '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('adjustments.fields.warehouse')}
                        error={!!errors.warehouse_id}
                        helperText={errors.warehouse_id?.message}
                        required
                      />
                    )}
                  />
                )}
              />

              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <AppDatePicker
                    value={field.value ?? ''}
                    onChange={(value) => field.onChange(value ?? '')}
                    label={t('adjustments.fields.date')}
                    error={!!errors.date}
                    helperText={errors.date?.message}
                    required
                  />
                )}
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('adjustments.fields.reason')}
                    error={!!errors.reason}
                    helperText={errors.reason?.message}
                  />
                )}
              />

              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('adjustments.fields.notes')}
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                  />
                )}
              />
            </Box>

            <Stack spacing={1.5}>
              <Box>
                <Typography variant="subtitle2">{t('adjustments.form.items')}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('adjustments.form.itemsHelp')}
                </Typography>
              </Box>

              <InventoryProductLookupPicker
                warehouseId={warehouseId || undefined}
                disabled={!warehouseId || isSaving}
                helperText={warehouseId ? t('adjustments.form.pickerHelp') : t('adjustments.messages.selectWarehouseFirst')}
                onSelect={addLookupItem}
              />

              {typeof errors.items?.message === 'string' && (
                <Alert severity="error">{errors.items.message}</Alert>
              )}

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('adjustments.fields.product')}</TableCell>
                      <TableCell>{t('adjustments.fields.direction')}</TableCell>
                      <TableCell align="right">{t('adjustments.fields.quantity')}</TableCell>
                      <TableCell align="right">{t('adjustments.fields.unitCost')}</TableCell>
                      <TableCell>{t('adjustments.fields.notes')}</TableCell>
                      <TableCell align="center">{t('adjustments.columns.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fields.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {t('adjustments.emptyItems')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}

                    {fields.map((field, index) => (
                      <TableRow key={field.fieldId}>
                        <TableCell sx={{ minWidth: 260 }}>
                          <Stack spacing={0.25}>
                            <Typography variant="body2">{field.product_label || field.product_id}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {[field.sku, field.lot_number, field.serial_number].filter(Boolean).join(' / ') || '-'}
                            </Typography>
                            {field.available_quantity !== undefined && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {t('lookup.available', { quantity: field.available_quantity ?? '-' })}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ width: 130 }}>
                          <Controller
                            name={`items.${index}.direction`}
                            control={control}
                            render={({ field }) => (
                              <TextField {...field} fullWidth select required>
                                <MenuItem value="in">{t('adjustments.directions.in')}</MenuItem>
                                <MenuItem value="out">{t('adjustments.directions.out')}</MenuItem>
                              </TextField>
                            )}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ width: 140 }}>
                          <Controller
                            name={`items.${index}.quantity`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                type="number"
                                error={!!errors.items?.[index]?.quantity}
                                helperText={errors.items?.[index]?.quantity?.message}
                                required
                                slotProps={{ htmlInput: { min: 0.0001, step: 0.0001 } }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ width: 140 }}>
                          <Controller
                            name={`items.${index}.unit_cost`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                value={field.value ?? ''}
                                fullWidth
                                type="number"
                                error={!!errors.items?.[index]?.unit_cost}
                                helperText={errors.items?.[index]?.unit_cost?.message}
                                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <Controller
                            name={`items.${index}.notes`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                value={field.value ?? ''}
                                fullWidth
                                error={!!errors.items?.[index]?.notes}
                                helperText={errors.items?.[index]?.notes?.message}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ width: 64 }}>
                          <Tooltip title={t('adjustments.actions.removeItem')}>
                            <IconButton color="error" disabled={isSaving} onClick={() => remove(index)}>
                              <DeleteOutlined />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving || warehouseOptions.length === 0}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
