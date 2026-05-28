'use client'

import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import {
  Alert,
  Button,
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

function buildDefaults(purchase: Purchase | null): ReceivePurchaseFormInput {
  return {
    received_at: today(),
    notes: '',
    items: (purchase?.items ?? [])
      .map((item) => ({
        purchase_item_id: item.id,
        product_label: itemLabel(item),
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
    await onSubmit(buildPayload(values))
    reset(buildDefaults(null))
  })

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle>Receive purchase {purchase?.purchase_number ?? ''}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {fields.length === 0 && <Alert severity="info">All purchase items have already been received.</Alert>}
          <Controller
            name="received_at"
            control={control}
            render={({ field }) => (
              <AppDatePicker
                label="Received date"
                value={field.value || ''}
                onChange={field.onChange}
                error={!!errors.received_at}
                helperText={errors.received_at?.message}
              />
            )}
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 260 }}>Item</TableCell>
                  <TableCell sx={{ width: 130 }} align="right">Remaining</TableCell>
                  <TableCell sx={{ width: 150 }}>Receive qty</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Lot</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Serials</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.fieldId}>
                    <TableCell>
                      <Typography variant="subtitle2">{field.product_label}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{field.stock_tracking ?? 'none'}</Typography>
                    </TableCell>
                    <TableCell align="right">{field.remaining_quantity}</TableCell>
                    <TableCell>
                      <Controller
                        name={`items.${index}.quantity`}
                        control={control}
                        render={({ field: inputField }) => (
                          <TextField
                            {...inputField}
                            type="number"
                            error={!!errors.items?.[index]?.quantity}
                            helperText={errors.items?.[index]?.quantity?.message}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {field.stock_tracking === 'lot' ? (
                        <Controller
                          name={`items.${index}.lot_number`}
                          control={control}
                          render={({ field: inputField }) => (
                            <TextField
                              {...inputField}
                              value={inputField.value ?? ''}
                              label="Lot number"
                              error={!!errors.items?.[index]?.lot_number}
                              helperText={errors.items?.[index]?.lot_number?.message}
                            />
                          )}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {field.stock_tracking === 'serial' ? (
                        <Controller
                          name={`items.${index}.serial_numbers_text`}
                          control={control}
                          render={({ field: inputField }) => (
                            <TextField
                              {...inputField}
                              value={inputField.value ?? ''}
                              multiline
                              minRows={2}
                              placeholder="SER-001, SER-002"
                              error={!!errors.items?.[index]?.serial_numbers_text}
                              helperText={errors.items?.[index]?.serial_numbers_text?.message}
                            />
                          )}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`items.${index}.notes`}
                        control={control}
                        render={({ field: inputField }) => (
                          <TextField {...inputField} value={inputField.value ?? ''} multiline minRows={2} />
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
      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={isSaving}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={isSaving || fields.length === 0}>Receive</Button>
      </DialogActions>
    </Dialog>
  )
}
