'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { saleReturnSchema } from './schema'
import { SaleReturnLineTable, type SaleReturnDraftLine } from './components/SaleReturnLineTable'
import type { Sale, SaleRefundMethod, SaleReturnPayload } from '@/types/sales'

interface SaleReturnDialogProps {
  open: boolean
  sale: Sale | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: SaleReturnPayload) => Promise<void>
}

const refundMethods: SaleRefundMethod[] = ['cash', 'credit_note', 'bank_transfer', 'reward_points']

function today() {
  return dayjs().format('YYYY-MM-DD')
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const numeric = Number(value ?? fallback)
  return Number.isFinite(numeric) ? numeric : fallback
}

function initialLines(sale: Sale | null): SaleReturnDraftLine[] {
  return (sale?.items ?? []).map((item) => ({
    sale_item_id: item.id,
    selected: false,
    quantity: toNumber(item.quantity),
    lot_id: item.lots?.length === 1 ? item.lots[0]?.lot_id ?? '' : '',
    serial_ids: [],
  }))
}

function lineUnitAmount(total: string | null | undefined, quantity: string | null | undefined) {
  const qty = Math.max(toNumber(quantity), 1)
  return toNumber(total) / qty
}

export function SaleReturnDialog({ open, sale, isSaving, onClose, onSubmit }: SaleReturnDialogProps) {
  const { t } = useTranslation(['sales', 'common'])
  const [returnDate, setReturnDate] = useState(today())
  const [refundMethod, setRefundMethod] = useState<SaleRefundMethod | ''>('credit_note')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<SaleReturnDraftLine[]>(() => initialLines(sale))
  const [formError, setFormError] = useState('')

  const selectedPayloadLines = useMemo(() => {
    return lines
      .filter((line) => line.selected)
      .map((line) => ({
        sale_item_id: line.sale_item_id,
        quantity: line.quantity,
        lot_id: line.lot_id || null,
        serial_ids: line.serial_ids,
      }))
  }, [lines])

  const estimatedTotal = useMemo(() => {
    return selectedPayloadLines.reduce((total, line) => {
      const saleItem = sale?.items?.find((item) => item.id === line.sale_item_id)
      if (!saleItem) return total

      return total + lineUnitAmount(saleItem.total_amount, saleItem.quantity) * line.quantity
    }, 0)
  }, [sale?.items, selectedPayloadLines])

  const handleSubmit = async () => {
    setFormError('')

    const payload: SaleReturnPayload = {
      return_date: returnDate,
      refund_method: refundMethod || null,
      notes: notes.trim() || null,
      items: selectedPayloadLines,
    }
    const parsed = saleReturnSchema.safeParse(payload)

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t('returns.form.invalid'))
      return
    }

    try {
      await onSubmit(parsed.data)
      onClose()
    } catch (error) {
      setFormError(toAppApiError(error).message)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="lg">
      <Box component="form" noValidate onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSubmit() }}>
        <DialogTitle>{t('returns.form.title', { number: sale?.sale_number ?? '' })}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <AppDatePicker
                label={t('returns.fields.returnDate')}
                value={returnDate}
                onChange={(value) => setReturnDate(value ?? '')}
                required
              />
              <FormControl disabled={isSaving}>
                <InputLabel id="refund-method-label">{t('returns.fields.refundMethod')}</InputLabel>
                <Select
                  labelId="refund-method-label"
                  label={t('returns.fields.refundMethod')}
                  value={refundMethod}
                  onChange={(event) => setRefundMethod(event.target.value as SaleRefundMethod | '')}
                >
                  <MenuItem value="">{t('returns.refundMethods.none')}</MenuItem>
                  {refundMethods.map((method) => (
                    <MenuItem key={method} value={method}>
                      {t(`returns.refundMethods.${method}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <SaleReturnLineTable
              items={sale?.items ?? []}
              lines={lines}
              disabled={isSaving}
              onChange={setLines}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 240px' }, gap: 2 }}>
              <TextField
                label={t('returns.fields.notes')}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                multiline
                minRows={2}
                disabled={isSaving}
              />
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  px: 2,
                  py: 1.5,
                  display: 'grid',
                  alignContent: 'center',
                  gap: 0.5,
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('returns.fields.estimatedTotal')}
                </Typography>
                <Typography variant="h6">{estimatedTotal.toFixed(2)}</Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" color="warning" disabled={isSaving}>
            {t('returns.actions.record')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
