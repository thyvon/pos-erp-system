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
import { reverseJournalSchema, type ReverseJournalFormInput, type ReverseJournalFormValues } from './schema'
import type { Journal, JournalReversePayload } from '@/types/accounting'

interface ReverseJournalDialogProps {
  open: boolean
  journal: Journal | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: JournalReversePayload) => Promise<void>
}

const defaultValues: ReverseJournalFormInput = {
  reason: '',
}

export function ReverseJournalDialog({
  open,
  journal,
  isSaving,
  onClose,
  onSubmit,
}: ReverseJournalDialogProps) {
  const { t } = useTranslation(['accounting', 'common'])
  const [serverError, setServerError] = useState('')
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ReverseJournalFormInput, unknown, ReverseJournalFormValues>({
    resolver: zodResolver(reverseJournalSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, reset])

  const submitForm = async (values: ReverseJournalFormValues) => {
    setServerError('')

    try {
      await onSubmit(values)
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof ReverseJournalFormInput, {
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
        <DialogTitle>{t('journals.reverse.title')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('journals.reverse.message', { number: journal?.journal_number ?? '' })}
            </Typography>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('journals.reverse.reason')}
                  error={!!errors.reason}
                  helperText={errors.reason?.message}
                  multiline
                  minRows={3}
                  required
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
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('journals.actions.reverse')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
