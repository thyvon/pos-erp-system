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
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { taxRateSchema, type TaxRateFormInput, type TaxRateFormValues } from './schema'
import type { TaxRate, TaxRatePayload } from '@/types/taxRate'

interface TaxRateFormDialogProps {
  open: boolean
  taxRate: TaxRate | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: TaxRatePayload) => Promise<void>
}

const defaultValues: TaxRateFormInput = {
  name: '',
  rate: 0,
  type: 'percentage',
  is_default: false,
  is_active: true,
}

function taxRateToFormValues(taxRate: TaxRate | null): TaxRateFormInput {
  if (!taxRate) return defaultValues

  return {
    name: taxRate.name,
    rate: taxRate.rate,
    type: taxRate.type,
    is_default: taxRate.is_default,
    is_active: taxRate.is_active,
  }
}

export function TaxRateFormDialog({
  open,
  taxRate,
  isSaving,
  onClose,
  onSubmit,
}: TaxRateFormDialogProps) {
  const { t } = useTranslation(['taxRates', 'common'])
  const [serverError, setServerError] = useState('')
  const title = taxRate ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => taxRateToFormValues(taxRate), [taxRate])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TaxRateFormInput, unknown, TaxRateFormValues>({
    resolver: zodResolver(taxRateSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const submitForm = async (formValues: TaxRateFormValues) => {
    setServerError('')

    try {
      await onSubmit(formValues)
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof TaxRateFormInput, {
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
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('fields.name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    required
                  />
                )}
              />

              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.type}>
                    <InputLabel id="tax-rate-type-label">{t('fields.type')}</InputLabel>
                    <Select {...field} labelId="tax-rate-type-label" label={t('fields.type')}>
                      <MenuItem value="percentage">{t('type.percentage')}</MenuItem>
                      <MenuItem value="fixed">{t('type.fixed')}</MenuItem>
                    </Select>
                    <FormHelperText>{errors.type?.message}</FormHelperText>
                  </FormControl>
                )}
              />

              <Controller
                name="rate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    type="number"
                    label={t('fields.rate')}
                    error={!!errors.rate}
                    helperText={errors.rate?.message}
                    slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                    required
                  />
                )}
              />
            </Box>

            <Stack spacing={1}>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                    label={t('fields.active')}
                  />
                )}
              />
              <Controller
                name="is_default"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                    label={t('fields.default')}
                  />
                )}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>
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
