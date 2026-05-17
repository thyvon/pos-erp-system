'use client'

import { useState } from 'react'
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
import { ArrowBack, DeleteOutlined, SaveOutlined } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { InventoryProductLookupPicker } from './components/InventoryProductLookupPicker'
import { useCreateStockCountMutation, useInventoryOptionsQuery, useUpdateStockCountItemMutation } from './hooks'
import { stockCountSchema, type StockCountFormInput, type StockCountFormValues } from './schema'
import type { InventoryProductLookupItem, StockCountItem, StockCountPayload } from '@/types/inventory'

const today = () => new Date().toISOString().slice(0, 10)

const itemColumnSx = {
  product: { width: 420, minWidth: 420 },
  counted: { width: 180, minWidth: 180 },
  unitCost: { width: 180, minWidth: 180 },
  actions: { width: 88, minWidth: 88 },
} as const

function getDefaultValues(): StockCountFormInput {
  return {
    warehouse_id: '',
    date: today(),
    notes: '',
    items: [],
  }
}

function buildPayload(values: StockCountFormValues): StockCountPayload {
  return {
    warehouse_id: values.warehouse_id,
    date: values.date,
    notes: values.notes ?? null,
    items: values.items?.map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      lot_id: item.lot_id ?? null,
      unit_cost: item.unit_cost ?? 0,
    })),
  }
}

export function StockCountFormPage() {
  const { t } = useTranslation(['inventory', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const [serverError, setServerError] = useState('')
  const optionsQuery = useInventoryOptionsQuery()
  const createCount = useCreateStockCountMutation()
  const updateCountItem = useUpdateStockCountItemMutation()
  const warehouseOptions = optionsQuery.data?.warehouses ?? []

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<StockCountFormInput, unknown, StockCountFormValues>({
    resolver: zodResolver(stockCountSchema),
    defaultValues: getDefaultValues(),
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
    keyName: 'fieldId',
  })

  const warehouseId = useWatch({ control, name: 'warehouse_id' })
  const countItems = useWatch({ control, name: 'items' }) ?? []
  const isSaving = createCount.isPending || updateCountItem.isPending

  const addLookupItem = (item: InventoryProductLookupItem) => {
    append({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      lot_id: item.lot_id ?? null,
      product_label: item.label,
      sku: item.sku ?? null,
      lot_number: item.lot_number ?? null,
      available_quantity: item.available_quantity ?? null,
      counted_quantity: 1,
      unit_cost: item.unit_cost ? Number(item.unit_cost) : 0,
    })
  }

  const findCreatedItem = (createdItems: StockCountItem[] | undefined, item: NonNullable<StockCountFormValues['items']>[number]) =>
    createdItems?.find((createdItem) =>
      createdItem.product_id === item.product_id
      && (createdItem.variation_id ?? null) === (item.variation_id ?? null)
      && ((createdItem.lot?.id ?? null) === (item.lot_id ?? null))
    )

  const saveInitialCountedQuantities = async (countId: string, createdItems: StockCountItem[] | undefined, items: StockCountFormValues['items'] = []) => {
    for (const item of items ?? []) {
      const createdItem = findCreatedItem(createdItems, item)

      if (!createdItem || item.counted_quantity === undefined) continue

      await updateCountItem.mutateAsync({
        countId,
        itemId: createdItem.id,
        payload: { counted_quantity: item.counted_quantity },
      })
    }
  }

  const submitForm = async (values: StockCountFormValues) => {
    setServerError('')

    try {
      const count = await createCount.mutateAsync(buildPayload(values))
      await saveInitialCountedQuantities(count.id, count.items, values.items ?? [])
      enqueueSnackbar(t('counts.messages.created'), { variant: 'success' })
      router.push(`/inventory/counts/${count.id}`)
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof StockCountFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4">{t('counts.form.createTitle')}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('counts.form.pageSubtitle')}
          </Typography>
        </Box>
        <Tooltip title={t('counts.actions.backToList')}>
          <IconButton
            size="small"
            aria-label={t('counts.actions.backToList')}
            onClick={() => router.push('/inventory/counts')}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>
      </Stack>

      {optionsQuery.isError && <Alert severity="error">{toAppApiError(optionsQuery.error).message}</Alert>}

      <Card>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
            <Stack spacing={2.5}>
              {serverError && <Alert severity="error">{serverError}</Alert>}
              {!optionsQuery.isLoading && warehouseOptions.length === 0 && (
                <Alert severity="warning">{t('counts.messages.noWarehouses')}</Alert>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 220px' }, gap: 2 }}>
                <FormControl error={!!errors.warehouse_id}>
                  <InputLabel id="count-page-warehouse-label">{t('counts.fields.warehouse')}</InputLabel>
                  <Controller
                    name="warehouse_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        value={field.value ?? ''}
                        labelId="count-page-warehouse-label"
                        label={t('counts.fields.warehouse')}
                        disabled={optionsQuery.isLoading}
                        required
                      >
                        {warehouseOptions.map((warehouse) => (
                          <MenuItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                            {warehouse.code ? ` (${warehouse.code})` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>{errors.warehouse_id?.message}</FormHelperText>
                </FormControl>

                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <AppDatePicker
                      value={field.value ?? ''}
                      onChange={(value) => field.onChange(value ?? '')}
                      label={t('counts.fields.date')}
                      error={!!errors.date}
                      helperText={errors.date?.message}
                      required
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
                    label={t('counts.fields.notes')}
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                  />
                )}
              />

              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="subtitle2">{t('counts.form.seedItems')}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('counts.form.seedItemsHelp')}
                  </Typography>
                </Box>

                <InventoryProductLookupPicker
                  warehouseId={warehouseId || undefined}
                  disabled={!warehouseId || isSaving}
                  helperText={warehouseId ? t('counts.form.pickerHelp') : t('counts.messages.selectWarehouseFirst')}
                  onSelect={addLookupItem}
                />

                <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 868, tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={itemColumnSx.product}>{t('counts.fields.product')}</TableCell>
                        <TableCell sx={itemColumnSx.counted} align="right">{t('counts.fields.actualCountedQuantity')}</TableCell>
                        <TableCell sx={itemColumnSx.unitCost} align="right">{t('counts.fields.unitCost')}</TableCell>
                        <TableCell sx={itemColumnSx.actions} align="right">{t('counts.columns.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {t('counts.emptySeedItems')}
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
                                {[field.sku, field.lot_number].filter(Boolean).join(' / ') || '-'}
                              </Typography>
                              {field.available_quantity !== undefined && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {t('lookup.available', { quantity: field.available_quantity ?? '-' })}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={itemColumnSx.counted}>
                            <Controller
                              name={`items.${index}.counted_quantity`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  value={field.value ?? ''}
                                  size="small"
                                  type="number"
                                  error={!!errors.items?.[index]?.counted_quantity}
                                  helperText={errors.items?.[index]?.counted_quantity?.message}
                                  slotProps={{ htmlInput: { min: 0, step: 0.0001, style: { textAlign: 'right' } } }}
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
                                  size="small"
                                  type="number"
                                  error={!!errors.items?.[index]?.unit_cost}
                                  helperText={errors.items?.[index]?.unit_cost?.message}
                                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell align="right" sx={itemColumnSx.actions}>
                            <Tooltip title={t('counts.actions.removeItem')}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={isSaving}
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
                <Button variant="outlined" onClick={() => router.push('/inventory/counts')} disabled={isSaving}>
                  {t('common:buttons.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isSaving ? undefined : <SaveOutlined />}
                  disabled={isSaving || warehouseOptions.length === 0}
                >
                  {isSaving ? <CircularProgress size={20} color="inherit" /> : countItems.length > 0 ? t('counts.actions.saveCount') : t('counts.actions.start')}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  )
}
