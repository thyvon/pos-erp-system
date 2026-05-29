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
    onClose()
  }

  const columnSx = {
    item: { width: 260, minWidth: 260 },
    remaining: { width: 100, minWidth: 100 },
    qty: { width: 130, minWidth: 130 },
    lot: { width: 160, minWidth: 160 },
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
                <TextField {...field} value={field.value ?? ''} label={t('receive.notes')} />
              )}
            />
          </Box>

          <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 1050, tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={columnSx.item}>{t('receive.item')}</TableCell>
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
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {[field.sku, field.stock_tracking !== 'none' ? field.stock_tracking : null].filter(Boolean).join(' / ') || '-'}
                        </Typography>
                      </Stack>
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
        <Button variant="outlined" onClick={onClose} disabled={isSaving}>{t('common:actions.cancel')}</Button>
        <Button variant="contained" onClick={submit} disabled={isSaving || fields.length === 0}>
          {isSaving ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
          {t('receive.receive')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
