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
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
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
import { ArrowBack, DeleteOutlined, SaveOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { InventoryProductLookupPicker } from './components/InventoryProductLookupPicker'
import {
  useCreateStockTransferMutation,
  useInventoryOptionsQuery,
  useStockTransferQuery,
  useUpdateStockTransferMutation,
} from './hooks'
import { stockTransferSchema, type StockTransferFormInput, type StockTransferFormValues } from './schema'
import type {
  InventoryProductLookupItem,
  InventoryWarehouseOption,
  StockTransfer,
  StockTransferItem,
  StockTransferPayload,
} from '@/types/inventory'

interface StockTransferFormPageProps {
  transferId?: string
}

const today = () => new Date().toISOString().slice(0, 10)

const itemColumnSx = {
  product: { width: 360, minWidth: 360 },
  quantity: { width: 160, minWidth: 160 },
  unitCost: { width: 160, minWidth: 160 },
  notes: { width: 240, minWidth: 240 },
  actions: { width: 88, minWidth: 88 },
} as const

const getDefaultValues = (): StockTransferFormInput => ({
  from_warehouse_id: '',
  to_warehouse_id: '',
  date: today(),
  notes: '',
  send: false,
  items: [],
})

function toNumber(value: string | number | null | undefined, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function getItemLabel(item: StockTransferItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function warehouseLabel(warehouse: InventoryWarehouseOption) {
  return [warehouse.name, warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')
}

function getTransferValues(transfer: StockTransfer | null | undefined): StockTransferFormInput {
  if (!transfer) return getDefaultValues()

  return {
    from_warehouse_id: transfer.from_warehouse_id,
    to_warehouse_id: transfer.to_warehouse_id,
    date: transfer.date,
    notes: transfer.notes ?? '',
    send: transfer.status === 'in_transit',
    items: transfer.items.map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      lot_id: item.lot_id ?? null,
      serial_id: item.serial_id ?? null,
      product_label: getItemLabel(item),
      sku: item.variation?.sku ?? item.product?.sku ?? null,
      lot_number: item.lot?.lot_number ?? null,
      serial_number: item.serial?.serial_number ?? null,
      available_quantity: null,
      quantity: toNumber(item.quantity, 1),
      unit_cost: toNumber(item.unit_cost),
      notes: item.notes ?? '',
    })),
  }
}

function buildPayload(values: StockTransferFormValues): StockTransferPayload {
  return {
    from_warehouse_id: values.from_warehouse_id,
    to_warehouse_id: values.to_warehouse_id,
    date: values.date,
    notes: values.notes ?? null,
    send: values.send ?? false,
    items: values.items.map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      lot_id: item.lot_id ?? null,
      serial_id: item.serial_id ?? null,
      quantity: item.quantity,
      unit_cost: item.unit_cost ?? 0,
      notes: item.notes ?? null,
    })),
  }
}

export function StockTransferFormPage({ transferId }: StockTransferFormPageProps) {
  const { t } = useTranslation(['inventory', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const [serverError, setServerError] = useState('')
  const isEdit = !!transferId

  const optionsQuery = useInventoryOptionsQuery()
  const transferQuery = useStockTransferQuery(transferId ?? null)
  const createTransfer = useCreateStockTransferMutation()
  const updateTransfer = useUpdateStockTransferMutation()

  const transfer = transferQuery.data ?? null
  const isReceived = transfer?.status === 'received'
  const isSaving = createTransfer.isPending || updateTransfer.isPending
  const fromWarehouseOptions = useMemo(() => optionsQuery.data?.transfer_from_warehouses ?? [], [optionsQuery.data])
  const toWarehouseOptions = useMemo(() => optionsQuery.data?.transfer_to_warehouses ?? [], [optionsQuery.data])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StockTransferFormInput, unknown, StockTransferFormValues>({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: getDefaultValues(),
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
    keyName: 'fieldId',
  })

  const fromWarehouseId = useWatch({ control, name: 'from_warehouse_id' })

  useEffect(() => {
    if (transfer) {
      reset(getTransferValues(transfer))
    }
  }, [reset, transfer])

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
      quantity: 1,
      unit_cost: item.unit_cost ? Number(item.unit_cost) : 0,
      notes: '',
    })
  }

  const submitForm = async (values: StockTransferFormValues) => {
    setServerError('')

    try {
      if (transferId) {
        await updateTransfer.mutateAsync({ id: transferId, payload: buildPayload(values) })
        enqueueSnackbar(t('transfers.messages.updated'), { variant: 'success' })
      } else {
        await createTransfer.mutateAsync(buildPayload(values))
        enqueueSnackbar(t('transfers.messages.created'), { variant: 'success' })
      }

      router.push('/inventory/transfers')
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof StockTransferFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  if (isEdit && transferQuery.isLoading) {
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
          <Typography variant="h4">
            {t(isEdit ? 'transfers.form.editTitle' : 'transfers.form.createTitle')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('transfers.form.pageSubtitle')}
          </Typography>
        </Box>
        <Tooltip title={t('transfers.actions.backToList')}>
          <IconButton
            size="small"
            aria-label={t('transfers.actions.backToList')}
            onClick={() => router.push('/inventory/transfers')}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>
      </Stack>

      {transferQuery.isError && <Alert severity="error">{toAppApiError(transferQuery.error).message}</Alert>}
      {optionsQuery.isError && <Alert severity="error">{toAppApiError(optionsQuery.error).message}</Alert>}

      <Card>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
            <Stack spacing={2.5}>
              {serverError && <Alert severity="error">{serverError}</Alert>}
              {!optionsQuery.isLoading && (fromWarehouseOptions.length === 0 || toWarehouseOptions.length === 0) && (
                <Alert severity="warning">{t('transfers.messages.noWarehouses')}</Alert>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 220px' }, gap: 2 }}>
                <Controller
                  name="from_warehouse_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={fromWarehouseOptions}
                      value={fromWarehouseOptions.find((warehouse) => warehouse.id === field.value) ?? null}
                      loading={optionsQuery.isLoading}
                      getOptionLabel={warehouseLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      disabled={optionsQuery.isLoading || isReceived}
                      onBlur={field.onBlur}
                      onChange={(_, warehouse) => field.onChange(warehouse?.id ?? '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('transfers.fields.fromWarehouse')}
                          error={!!errors.from_warehouse_id}
                          helperText={errors.from_warehouse_id?.message}
                          required
                        />
                      )}
                    />
                  )}
                />

                <Controller
                  name="to_warehouse_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={toWarehouseOptions}
                      value={toWarehouseOptions.find((warehouse) => warehouse.id === field.value) ?? null}
                      loading={optionsQuery.isLoading}
                      getOptionLabel={warehouseLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      disabled={optionsQuery.isLoading}
                      onBlur={field.onBlur}
                      onChange={(_, warehouse) => field.onChange(warehouse?.id ?? '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('transfers.fields.toWarehouse')}
                          error={!!errors.to_warehouse_id}
                          helperText={errors.to_warehouse_id?.message}
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
                      label={t('transfers.fields.date')}
                      error={!!errors.date}
                      helperText={errors.date?.message}
                      required
                    />
                  )}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 2, alignItems: 'center' }}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      label={t('transfers.fields.notes')}
                      error={!!errors.notes}
                      helperText={errors.notes?.message}
                    />
                  )}
                />
                <Controller
                  name="send"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                          disabled={isReceived}
                        />
                      }
                      label={t('transfers.fields.sendNow')}
                    />
                  )}
                />
              </Box>

              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="subtitle2">{t('transfers.form.items')}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('transfers.form.itemsHelp')}
                  </Typography>
                </Box>

                <InventoryProductLookupPicker
                  warehouseId={fromWarehouseId || undefined}
                  disabled={!fromWarehouseId || isSaving || isReceived}
                  helperText={fromWarehouseId ? t('transfers.form.pickerHelp') : t('transfers.messages.selectSourceFirst')}
                  onSelect={addLookupItem}
                />

                {typeof errors.items?.message === 'string' && (
                  <Alert severity="error">{errors.items.message}</Alert>
                )}

                <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 1008, tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={itemColumnSx.product}>{t('transfers.fields.product')}</TableCell>
                        <TableCell sx={itemColumnSx.quantity} align="right">{t('transfers.fields.quantity')}</TableCell>
                        <TableCell sx={itemColumnSx.unitCost} align="right">{t('transfers.fields.unitCost')}</TableCell>
                        <TableCell sx={itemColumnSx.notes}>{t('transfers.fields.notes')}</TableCell>
                        <TableCell sx={itemColumnSx.actions} align="center">{t('transfers.columns.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {t('transfers.emptyItems')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}

                      {fields.map((field, index) => (
                        <TableRow key={field.fieldId}>
                          <TableCell sx={itemColumnSx.product}>
                            <Stack spacing={0.25}>
                              <Typography variant="body2">{field.product_label || field.product_id}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {[field.sku, field.lot_number, field.serial_number].filter(Boolean).join(' / ') || '-'}
                              </Typography>
                              {field.available_quantity !== null && field.available_quantity !== undefined && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {t('lookup.available', { quantity: field.available_quantity })}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={itemColumnSx.quantity}>
                            <Controller
                              name={`items.${index}.quantity`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  type="number"
                                  disabled={isReceived}
                                  error={!!errors.items?.[index]?.quantity}
                                  helperText={errors.items?.[index]?.quantity?.message}
                                  required
                                  slotProps={{ htmlInput: { min: 0.0001, step: 0.0001 } }}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell align="right" sx={itemColumnSx.unitCost}>
                            <Controller
                              name={`items.${index}.unit_cost`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  value={field.value ?? ''}
                                  fullWidth
                                  type="number"
                                  disabled={isReceived}
                                  error={!!errors.items?.[index]?.unit_cost}
                                  helperText={errors.items?.[index]?.unit_cost?.message}
                                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell sx={itemColumnSx.notes}>
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
                          <TableCell align="center" sx={itemColumnSx.actions}>
                            <Tooltip title={t('transfers.actions.removeItem')}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={isSaving || isReceived}
                                  onClick={() => remove(index)}
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
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => router.push('/inventory/transfers')} disabled={isSaving}>
                  {t('common:buttons.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isSaving ? undefined : <SaveOutlined />}
                  disabled={isSaving || fromWarehouseOptions.length === 0 || toWarehouseOptions.length === 0}
                >
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
