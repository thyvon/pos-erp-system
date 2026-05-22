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
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { exchangeRateSchema, type ExchangeRateFormInput, type ExchangeRateFormValues } from './schema'
import type { ExchangeRate, ExchangeRatePayload } from '@/types/accounting'

interface ExchangeRateFormDialogProps {
  open: boolean
  exchangeRate: ExchangeRate | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: ExchangeRatePayload) => Promise<void>
}

const defaultValues: ExchangeRateFormInput = {
  from_currency: 'USD',
  to_currency: 'KHR',
  rate: 4100,
  effective_date: dayjs().format('YYYY-MM-DD'),
  is_default: true,
  note: '',
}

function exchangeRateToFormValues(exchangeRate: ExchangeRate | null): ExchangeRateFormInput {
  if (!exchangeRate) return defaultValues

  return {
    from_currency: 'USD',
    to_currency: 'KHR',
    rate: Number(exchangeRate.rate ?? 0),
    effective_date: exchangeRate.effective_date,
    is_default: exchangeRate.is_default,
    note: exchangeRate.note ?? '',
  }
}

export function ExchangeRateFormDialog({
  open,
  exchangeRate,
  isSaving,
  onClose,
  onSubmit,
}: ExchangeRateFormDialogProps) {
  const { t } = useTranslation(['accounting', 'common'])
  const [serverError, setServerError] = useState('')
  const title = exchangeRate ? t('exchangeRates.form.editTitle') : t('exchangeRates.form.createTitle')
  const values = useMemo(() => exchangeRateToFormValues(exchangeRate), [exchangeRate])
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ExchangeRateFormInput, unknown, ExchangeRateFormValues>({
    resolver: zodResolver(exchangeRateSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const submitForm = async (values: ExchangeRateFormValues) => {
    setServerError('')

    try {
      await onSubmit({
        ...values,
        note: values.note || null,
      })
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof ExchangeRateFormInput, {
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
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Controller
                name="from_currency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label={t('exchangeRates.fields.fromCurrency')}
                    error={!!errors.from_currency}
                    helperText={errors.from_currency?.message}
                    required
                  >
                    <MenuItem value="USD">USD</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="to_currency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label={t('exchangeRates.fields.toCurrency')}
                    error={!!errors.to_currency}
                    helperText={errors.to_currency?.message}
                    required
                  >
                    <MenuItem value="KHR">KHR</MenuItem>
                  </TextField>
                )}
              />
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Controller
                name="rate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t('exchangeRates.fields.rate')}
                    error={!!errors.rate}
                    helperText={errors.rate?.message || t('exchangeRates.form.rateHelp')}
                    required
                    slotProps={{ htmlInput: { min: 0.000001, step: 0.000001 } }}
                  />
                )}
              />
              <Controller
                name="effective_date"
                control={control}
                render={({ field }) => (
                  <AppDatePicker
                    label={t('exchangeRates.fields.effectiveDate')}
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.effective_date}
                    helperText={errors.effective_date?.message}
                    required
                  />
                )}
              />
            </Box>
            <Controller
              name="is_default"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                  label={t('exchangeRates.fields.default')}
                />
              )}
            />
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('exchangeRates.fields.note')}
                  error={!!errors.note}
                  helperText={errors.note?.message}
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
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
