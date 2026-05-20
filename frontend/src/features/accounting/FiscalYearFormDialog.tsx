'use client'

import { useEffect, useMemo, useState } from 'react'
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
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { fiscalYearSchema, type FiscalYearFormInput, type FiscalYearFormValues } from './schema'
import type { FiscalYear, FiscalYearPayload, FiscalYearStatus } from '@/types/accounting'

interface FiscalYearFormDialogProps {
  open: boolean
  fiscalYear: FiscalYear | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: FiscalYearPayload) => Promise<void>
}

const statuses: FiscalYearStatus[] = ['active', 'closed']

const defaultValues: FiscalYearFormInput = {
  name: '',
  start_date: '',
  end_date: '',
  status: 'active',
}

function fiscalYearToFormValues(fiscalYear: FiscalYear | null): FiscalYearFormInput {
  if (!fiscalYear) return defaultValues

  return {
    name: fiscalYear.name,
    start_date: fiscalYear.start_date,
    end_date: fiscalYear.end_date,
    status: fiscalYear.status,
  }
}

export function FiscalYearFormDialog({
  open,
  fiscalYear,
  isSaving,
  onClose,
  onSubmit,
}: FiscalYearFormDialogProps) {
  const { t } = useTranslation(['accounting', 'common'])
  const [serverError, setServerError] = useState('')
  const title = fiscalYear ? t('fiscalYears.form.editTitle') : t('fiscalYears.form.createTitle')
  const values = useMemo(() => fiscalYearToFormValues(fiscalYear), [fiscalYear])
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FiscalYearFormInput, unknown, FiscalYearFormValues>({
    resolver: zodResolver(fiscalYearSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const submitForm = async (values: FiscalYearFormValues) => {
    setServerError('')

    try {
      await onSubmit(values)
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof FiscalYearFormInput, {
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
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('fiscalYears.fields.name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  required
                />
              )}
            />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Controller
                name="start_date"
                control={control}
                render={({ field }) => (
                  <AppDatePicker
                    label={t('fiscalYears.fields.startDate')}
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.start_date}
                    helperText={errors.start_date?.message}
                    required
                  />
                )}
              />
              <Controller
                name="end_date"
                control={control}
                render={({ field }) => (
                  <AppDatePicker
                    label={t('fiscalYears.fields.endDate')}
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.end_date}
                    helperText={errors.end_date?.message}
                    required
                  />
                )}
              />
            </Box>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={t('fiscalYears.fields.status')}
                  error={!!errors.status}
                  helperText={errors.status?.message}
                  required
                >
                  {statuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {t(`fiscalYears.statuses.${status}`)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
