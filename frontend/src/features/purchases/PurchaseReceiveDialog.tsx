'use client'

import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { receivePurchaseSchema, type ReceivePurchaseFormInput, type ReceivePurchaseFormValues } from './schema'
import { UnitConversionBadge } from '@/features/sales/components/UnitConversionBadge'
import type { Purchase, ReceivePurchasePayload } from '@/types/purchase'

interface PurchaseReceiveDialogProps {
  open: boolean
  purchase: Purchase | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: ReceivePurchasePayload) => Promise<void>
}

const today = () => new Date().toISOString().slice(0, 10)

function toNumber(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

function itemLabel(item: Purchase['items'][number]) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function itemSku(item: Purchase['items'][number]) {
  return item.variation?.sku ?? item.product?.sku ?? null
}

function buildDefaults(purchase: Purchase | null): ReceivePurchaseFormInput {
  return {
    received_at: today(),
    notes: '',
    items: (purchase?.items ?? [])
      .map((item) => ({
        purchase_item_id: item.id,
        product_label: itemLabel(item),
        sku: itemSku(item),
        stock_tracking: item.product?.stock_tracking ?? 'none',
        sub_unit_id: item.sub_unit_id ?? null,
        _conversion_factor: item.sub_unit?.conversion_factor ?? null,
        _base_unit_label: item.product?.unit?.short_name ?? null,
        sub_unit_label: item.sub_unit?.short_name ?? null,
        remaining_quantity: Math.max(0, toNumber(item.quantity) - toNumber(item.received_quantity)),
        quantity: Math.max(0, toNumber(item.quantity) - toNumber(item.received_quantity)),
        lot_number: '',
        manufacture_date: null,
        expiry_date: null,
        serial_numbers_text: '',
        warranty_expires: null,
        notes: '',
      }))
      .filter((item) => item.remaining_quantity > 0),
  }
}

function buildPayload(values: ReceivePurchaseFormValues): ReceivePurchasePayload {
  return {
    received_at: values.received_at || null,
    notes: values.notes || null,
    items: values.items.map((item) => ({
      purchase_item_id: item.purchase_item_id,
      quantity: item.quantity,
      lot_number: item.lot_number || null,
      manufacture_date: item.manufacture_date || null,
      expiry_date: item.expiry_date || null,
      serial_numbers: item.stock_tracking === 'serial'
        ? (item.serial_numbers_text ?? '').split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean)
        : undefined,
      warranty_expires: item.warranty_expires || null,
      notes: item.notes || null,
    })),
  }
}

export function PurchaseReceiveDialog({ open, purchase, isSaving, onClose, onSubmit }: PurchaseReceiveDialogProps) {
  const { t } = useTranslation(['purchases', 'common'])
  const [serverError, setServerError] = useState('')
  const defaultValues = useMemo(() => buildDefaults(purchase), [purchase])
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReceivePurchaseFormInput, unknown, ReceivePurchaseFormValues>({
    resolver: zodResolver(receivePurchaseSchema),
    values: defaultValues,
  })
  const { fields } = useFieldArray({ control, name: 'items', keyName: 'fieldId' })

  const submit = handleSubmit(async (values) => {
    setServerError('')

    try {
      await onSubmit(buildPayload(values))
      setServerError('')
      reset(buildDefaults(null))
    } catch (error) {
      const apiError = toAppApiError(error)
      setServerError(apiError.message)
    }
  })

  const closeDialog = () => {
    setServerError('')
    reset(buildDefaults(null))
    onClose()
  }

  const columnSx = {
    item: { width: 230, minWidth: 230 },
    unit: { width: 110, minWidth: 110 },
    remaining: { width: 100, minWidth: 100 },
    qty: { width: 130, minWidth: 130 },
    lot: { width: 240, minWidth: 240 },
    serials: { width: 200, minWidth: 200 },
    notes: { width: 200, minWidth: 200 },
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : closeDialog} fullWidth maxWidth="lg">
      <DialogTitle>
        <Stack spacing={0.25}>
          <Typography variant="h6">{t('receive.dialogTitle', { number: purchase?.purchase_number ?? '' })}</Typography>
          {purchase?.supplier && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {purchase.supplier.name}
            </Typography>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {serverError && <Alert severity="error">{serverError}</Alert>}
          {fields.length === 0 && <Alert severity="info">{t('receive.allReceived')}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 2 }}>
            <Controller
              name="received_at"
              control={control}
              render={({ field }) => (
                <AppDatePicker
                  label={t('receive.receiveDate')}
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={!!errors.received_at}
                  helperText={errors.received_at?.message}
                />
              )}
            />
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label={t('receive.notes')} error={!!errors.notes} helperText={errors.notes?.message} />
              )}
            />
          </Box>

          <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 1240, tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={columnSx.item}>{t('receive.item')}</TableCell>
                  <TableCell sx={columnSx.unit}>{t('form.subUnit')}</TableCell>
                  <TableCell sx={columnSx.remaining} align="right">{t('receive.remaining')}</TableCell>
                  <TableCell sx={columnSx.qty}>{t('receive.receiveQty')}</TableCell>
                  <TableCell sx={columnSx.lot}>{t('receive.lot')}</TableCell>
                  <TableCell sx={columnSx.serials}>{t('receive.serials')}</TableCell>
                  <TableCell sx={columnSx.notes}>{t('receive.notes')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.fieldId}>
                    <TableCell sx={columnSx.item}>
                      <Stack spacing={0.25}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{field.product_label}</Typography>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {field.sku || '-'}
                          </Typography>
                          {field.sub_unit_id && field._conversion_factor ? (
                            <UnitConversionBadge
                              conversionFactor={field._conversion_factor}
                              baseUnitLabel={field._base_unit_label ?? ''}
                              subUnitLabel={field.sub_unit_label ?? ''}
                              quantity={Number(field.quantity)}
                            />
                          ) : field._base_unit_label ? (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              · {field._base_unit_label}
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
                    <TableCell sx={columnSx.unit}>
                      {field.sub_unit_id ? (field.sub_unit_label ?? '-') : (field._base_unit_label ?? '-')}
                    </TableCell>
                    <TableCell sx={columnSx.remaining} align="right">
                      <Typography variant="body2">{field.remaining_quantity}</Typography>
                    </TableCell>
                    <TableCell sx={columnSx.qty}>
                        <Controller
                          name={`items.${index}.quantity`}
                          control={control}
                          render={({ field: f }) => (
                            <TextField
                              {...f}
                              type="number"
                              error={!!errors.items?.[index]?.quantity}
                              helperText={errors.items?.[index]?.quantity?.message}
                              slotProps={{ htmlInput: { min: 0.0001, step: 0.0001 } }}
                            />
                          )}
                        />
                    </TableCell>
                    <TableCell sx={columnSx.lot}>
                      {field.stock_tracking === 'lot' ? (
                        <Stack spacing={1}>
                          <Controller
                            name={`items.${index}.lot_number`}
                            control={control}
                            render={({ field: f }) => (
                              <TextField
                                {...f}
                                value={f.value ?? ''}
                                label={t('receive.lot')}
                                error={!!errors.items?.[index]?.lot_number}
                                helperText={errors.items?.[index]?.lot_number?.message}
                              />
                            )}
                          />
                          <Controller
                            name={`items.${index}.manufacture_date`}
                            control={control}
                            render={({ field: f }) => (
                              <AppDatePicker
                                label={t('receive.manufactureDate')}
                                value={f.value ?? ''}
                                onChange={f.onChange}
                              />
                            )}
                          />
                          <Controller
                            name={`items.${index}.expiry_date`}
                            control={control}
                            render={({ field: f }) => (
                              <AppDatePicker
                                label={t('receive.expiryDate')}
                                value={f.value ?? ''}
                                onChange={f.onChange}
                              />
                            )}
                          />
                          <Controller
                            name={`items.${index}.warranty_expires`}
                            control={control}
                            render={({ field: f }) => (
                              <AppDatePicker
                                label={t('receive.warrantyExpires')}
                                value={f.value ?? ''}
                                onChange={f.onChange}
                              />
                            )}
                          />
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={columnSx.serials}>
                      {field.stock_tracking === 'serial' ? (
                        <Controller
                          name={`items.${index}.serial_numbers_text`}
                          control={control}
                          render={({ field: f }) => (
                            <TextField
                              {...f}
                              value={f.value ?? ''}
                              multiline
                              minRows={1}
                              maxRows={3}
                              placeholder={t('receive.serialsPlaceholder')}
                              error={!!errors.items?.[index]?.serial_numbers_text}
                              helperText={errors.items?.[index]?.serial_numbers_text?.message}
                              onPaste={(event: React.ClipboardEvent) => {
                                const pasted = event.clipboardData.getData('text')
                                const split = pasted.split(/[\r\n,;\t]+|  +/).map((s) => s.trim()).filter(Boolean)
                                if (split.length > 1) {
                                  event.preventDefault()
                                  const existing = (f.value ?? '').trim()
                                  const merged = existing ? existing + '\n' + split.join('\n') : split.join('\n')
                                  f.onChange(merged)
                                }
                              }}
                            />
                          )}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={columnSx.notes}>
                      <Controller
                        name={`items.${index}.notes`}
                        control={control}
                        render={({ field: f }) => (
                          <TextField {...f} value={f.value ?? ''} />
                        )}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={isSaving}>{t('common:buttons.cancel')}</Button>
        <Button variant="contained" onClick={submit} disabled={isSaving || fields.length === 0}>
          {isSaving ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
          {t('receive.receive')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
