'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { taxGroupSchema, type TaxGroupFormInput, type TaxGroupFormValues } from './schema'
import type { TaxGroup, TaxGroupPayload } from '@/types/taxGroup'
import type { TaxRate } from '@/types/taxRate'

interface TaxGroupFormDialogProps {
  open: boolean
  taxGroup: TaxGroup | null
  taxRates: TaxRate[]
  taxRatesLoading: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: TaxGroupPayload) => Promise<void>
}

const defaultValues: TaxGroupFormInput = {
  name: '',
  description: '',
  is_active: true,
  tax_rate_ids: [],
}

function taxGroupToFormValues(taxGroup: TaxGroup | null): TaxGroupFormInput {
  if (!taxGroup) return defaultValues

  return {
    name: taxGroup.name,
    description: taxGroup.description ?? '',
    is_active: taxGroup.is_active,
    tax_rate_ids: taxGroup.tax_rate_ids,
  }
}

function formatTaxRate(taxRate: TaxRate) {
  return taxRate.type === 'percentage' ? `${taxRate.rate}%` : taxRate.rate.toFixed(2)
}

export function TaxGroupFormDialog({
  open,
  taxGroup,
  taxRates,
  taxRatesLoading,
  isSaving,
  onClose,
  onSubmit,
}: TaxGroupFormDialogProps) {
  const { t } = useTranslation(['taxGroups', 'common'])
  const [serverError, setServerError] = useState('')
  const title = taxGroup ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => taxGroupToFormValues(taxGroup), [taxGroup])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TaxGroupFormInput, unknown, TaxGroupFormValues>({
    resolver: zodResolver(taxGroupSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const submitForm = async (formValues: TaxGroupFormValues) => {
    setServerError('')

    try {
      await onSubmit(formValues)
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof TaxGroupFormInput, {
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
                  label={t('fields.name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  required
                />
              )}
            />

            <Controller
              name="tax_rate_ids"
              control={control}
              render={({ field }) => {
                const selectedRates = taxRates.filter((taxRate) => field.value.includes(taxRate.id))

                return (
                  <Autocomplete
                    multiple
                    options={taxRates}
                    value={selectedRates}
                    loading={taxRatesLoading}
                    disableCloseOnSelect
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) => `${option.name} (${formatTaxRate(option)})`}
                    onChange={(_, nextValue) => field.onChange(nextValue.map((taxRate) => taxRate.id))}
                    renderValue={(value, getItemProps) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {value.map((option, index) => {
                          const { key, ...itemProps } = getItemProps({ index })

                          return (
                            <Chip
                              key={key}
                              size="small"
                              label={`${option.name} (${formatTaxRate(option)})`}
                              {...itemProps}
                            />
                          )
                        })}
                      </Box>
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={option.id}>
                        <Stack spacing={0.25}>
                          <Typography variant="body2">{option.name}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t(`taxRateType.${option.type}`)} · {formatTaxRate(option)}
                          </Typography>
                        </Stack>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('fields.taxRates')}
                        error={!!errors.tax_rate_ids}
                        helperText={errors.tax_rate_ids?.message || t('help.taxRates')}
                        required
                      />
                    )}
                  />
                )
              }}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('fields.description')}
                  multiline
                  minRows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving || taxRatesLoading}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
