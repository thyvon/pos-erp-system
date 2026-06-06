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
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { purchaseReturnSchema } from './schema'
import { PurchaseReturnLineTable, type PurchaseReturnDraftLine } from './components/PurchaseReturnLineTable'
import type { Purchase, PurchaseReturnPayload } from '@/types/purchase'

interface PurchaseReturnDialogProps {
  open: boolean
  purchase: Purchase | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: PurchaseReturnPayload) => Promise<void>
}

function today() {
  return dayjs().format('YYYY-MM-DD')
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const numeric = Number(value ?? fallback)
  return Number.isFinite(numeric) ? numeric : fallback
}

function initialLines(purchase: Purchase | null): PurchaseReturnDraftLine[] {
  return (purchase?.items ?? []).map((item) => ({
    purchase_item_id: item.id,
    selected: false,
    quantity: toNumber(item.received_quantity ?? item.quantity),
    lot_id: '',
    serial_ids: [],
  }))
}

export function PurchaseReturnDialog({ open, purchase, isSaving, onClose, onSubmit }: PurchaseReturnDialogProps) {
  const { t } = useTranslation(['purchases', 'common'])
  const [returnDate, setReturnDate] = useState(today())
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<PurchaseReturnDraftLine[]>(() => initialLines(purchase))
  const [formError, setFormError] = useState('')

  const selectedPayloadLines = useMemo(() => {
    return lines
      .filter((line) => line.selected)
      .map((line) => ({
        purchase_item_id: line.purchase_item_id,
        quantity: purchase?.items?.find((item) => item.id === line.purchase_item_id)?.product?.stock_tracking === 'serial'
          ? line.serial_ids.length
          : line.quantity,
        lot_id: line.lot_id || null,
        serial_ids: line.serial_ids,
      }))
  }, [lines, purchase?.items])

  const estimatedTotal = useMemo(() => {
    return selectedPayloadLines.reduce((total, line) => {
      const purchaseItem = purchase?.items?.find((item) => item.id === line.purchase_item_id)
      if (!purchaseItem) return total
      return total + toNumber(purchaseItem.unit_cost) * line.quantity
    }, 0)
  }, [purchase?.items, selectedPayloadLines])

  const handleSubmit = async () => {
    setFormError('')

    const invalidTrackedLine = lines
      .filter((line) => line.selected)
      .map((line) => ({
        line,
        item: purchase?.items?.find((purchaseItem) => purchaseItem.id === line.purchase_item_id),
      }))
      .find(({ line, item }) => {
        const tracking = item?.product?.stock_tracking
        return (tracking === 'lot' && !line.lot_id) || (tracking === 'serial' && line.serial_ids.length === 0)
      })

    if (invalidTrackedLine) {
      setFormError(
        invalidTrackedLine.item?.product?.stock_tracking === 'lot'
          ? t('returns.form.lotRequired')
          : t('returns.form.serialRequired')
      )
      return
    }

    const payload: PurchaseReturnPayload = {
      return_date: returnDate,
      notes: notes.trim() || null,
      items: selectedPayloadLines,
    }
    const parsed = purchaseReturnSchema.safeParse(payload)

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
        <DialogTitle>{t('returns.form.title', { number: purchase?.purchase_number ?? '' })}</DialogTitle>
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
            </Box>

            <PurchaseReturnLineTable
              items={purchase?.items ?? []}
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
