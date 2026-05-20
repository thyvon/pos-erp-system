'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
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
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { saleCancelSchema, type SaleCancelFormInput, type SaleCancelFormValues } from './schema'
import type { Sale, SaleCancelPayload } from '@/types/sales'

interface SaleCancelDialogProps {
  open: boolean
  sale: Sale | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: SaleCancelPayload) => Promise<void>
}

const defaultValues: SaleCancelFormInput = {
  reason: '',
}

export function SaleCancelDialog({
  open,
  sale,
  isSaving,
  onClose,
  onSubmit,
}: SaleCancelDialogProps) {
  const { t } = useTranslation(['sales', 'common'])
  const [serverError, setServerError] = useState('')
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<SaleCancelFormInput, unknown, SaleCancelFormValues>({
    resolver: zodResolver(saleCancelSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, reset])

  const submitForm = async (values: SaleCancelFormValues) => {
    setServerError('')

    try {
      await onSubmit({ reason: values.reason || null })
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof SaleCancelFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <DialogTitle>{t('cancel.title')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('cancel.message', { number: sale?.sale_number ?? '' })}
            </Typography>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('cancel.reason')}
                  error={!!errors.reason}
                  helperText={errors.reason?.message}
                  multiline
                  minRows={3}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" color="warning" disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('actions.cancelSale')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
