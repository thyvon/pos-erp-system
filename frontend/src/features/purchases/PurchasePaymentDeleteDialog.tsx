'use client'

import { useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

interface PurchasePaymentDeleteDialogProps {
  open: boolean
  isSaving?: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function PurchasePaymentDeleteDialog({
  open,
  isSaving = false,
  onClose,
  onConfirm,
}: PurchasePaymentDeleteDialogProps) {
  const { t } = useTranslation(['purchases', 'common'])
  const [reason, setReason] = useState('')
  const [error, setError] = useState(false)

  const handleConfirm = () => {
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      setError(true)
      return
    }

    onConfirm(trimmedReason)
  }

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="purchase-payment-delete-title"
    >
      <DialogTitle id="purchase-payment-delete-title">{t('payment.deleteTitle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <DialogContentText>{t('payment.deleteConfirm')}</DialogContentText>
          <TextField
            label={t('payment.reason')}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              if (error && event.target.value.trim()) {
                setError(false)
              }
            }}
            error={error}
            helperText={error ? t('payment.reasonRequired') : t('payment.deleteReasonHelp')}
            required
            multiline
            minRows={3}
            fullWidth
            disabled={isSaving}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={isSaving}>
          {t('common:buttons.cancel')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={isSaving}
        >
          {isSaving ? <CircularProgress size={20} color="inherit" /> : t('payment.deleteAction')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
