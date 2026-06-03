'use client'

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { quotationConvertSchema } from './schema'
import type { QuotationConvertPayload, Sale } from '@/types/sales'

interface QuotationConvertDialogProps {
  open: boolean
  quotation: Sale | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: QuotationConvertPayload) => Promise<void>
}

const convertTypes: QuotationConvertPayload['type'][] = ['invoice', 'draft', 'pos_sale', 'suspended']

function today() {
  return dayjs().format('YYYY-MM-DD')
}

export function QuotationConvertDialog({ open, quotation, isSaving, onClose, onSubmit }: QuotationConvertDialogProps) {
  const { t } = useTranslation(['sales', 'common'])
  const [type, setType] = useState<QuotationConvertPayload['type']>('invoice')
  const [saleDate, setSaleDate] = useState(today())
  const [dueDate, setDueDate] = useState<string | null>(quotation?.due_date ?? null)
  const [notes, setNotes] = useState(quotation?.notes ?? '')
  const [staffNote, setStaffNote] = useState(quotation?.staff_note ?? '')
  const [formError, setFormError] = useState('')

  const handleSubmit = async () => {
    setFormError('')

    const parsed = quotationConvertSchema.safeParse({
      type,
      sale_date: saleDate || null,
      due_date: dueDate || null,
      notes: notes.trim() || null,
      staff_note: staffNote.trim() || null,
    })

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t('quotations.convert.invalid'))
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
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('quotations.convert.title', { number: quotation?.sale_number ?? '' })}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            select
            label={t('fields.type')}
            value={type}
            onChange={(event) => setType(event.target.value as QuotationConvertPayload['type'])}
            disabled={isSaving}
            required
          >
            {convertTypes.map((item) => (
              <MenuItem key={item} value={item}>
                {t(`types.${item}`)}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <AppDatePicker
              label={t('fields.saleDate')}
              value={saleDate}
              onChange={(value) => setSaleDate(value ?? '')}
              required
            />
            <AppDatePicker
              label={t('fields.dueDate')}
              value={dueDate}
              onChange={setDueDate}
              minDate={saleDate}
            />
          </Box>
          <TextField
            label={t('fields.notes')}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            multiline
            minRows={2}
            disabled={isSaving}
          />
          <TextField
            label={t('fields.staffNote')}
            value={staffNote}
            onChange={(event) => setStaffNote(event.target.value)}
            multiline
            minRows={2}
            disabled={isSaving}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={isSaving}>
          {t('common:buttons.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSaving}>
          {t('quotations.actions.convert')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
