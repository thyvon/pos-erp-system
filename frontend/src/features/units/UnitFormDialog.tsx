'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, type FieldErrors, useFieldArray, useForm, useWatch } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Add, DeleteOutlined } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { unitSchema, type UnitFormInput, type UnitFormValues } from './schema'
import type { Unit, UnitPayload } from '@/types/unit'

interface UnitFormDialogProps {
  open: boolean
  unit: Unit | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: UnitPayload) => Promise<void>
}

const defaultValues: UnitFormInput = {
  name: '',
  short_name: '',
  allow_decimal: false,
  sub_units: [],
}

function unitToFormValues(unit: Unit | null): UnitFormInput {
  if (!unit) return defaultValues

  return {
    name: unit.name,
    short_name: unit.short_name,
    allow_decimal: unit.allow_decimal,
    sub_units: unit.sub_units.map((subUnit) => ({
      id: subUnit.id,
      name: subUnit.name,
      short_name: subUnit.short_name,
      conversion_factor: Number(subUnit.conversion_factor),
    })),
  }
}

function buildUnitPayload(values: UnitFormValues): UnitPayload {
  return {
    name: values.name,
    short_name: values.short_name,
    allow_decimal: values.allow_decimal,
    sub_units: values.sub_units.map((subUnit) => ({
      id: subUnit.id ?? null,
      name: subUnit.name,
      short_name: subUnit.short_name,
      conversion_factor: subUnit.conversion_factor,
    })),
  }
}

export function UnitFormDialog({
  open,
  unit,
  isSaving,
  onClose,
  onSubmit,
}: UnitFormDialogProps) {
  const { t } = useTranslation(['units', 'common'])
  const [serverError, setServerError] = useState('')
  const title = unit ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => unitToFormValues(unit), [unit])
  const usedSubUnitIds = useMemo(
    () => new Set((unit?.sub_units ?? []).filter((su) => su.is_used).map((su) => su.id)),
    [unit],
  )

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<UnitFormInput, unknown, UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues,
  })
  const watchedSubUnits = useWatch({ control, name: 'sub_units' })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sub_units',
  })

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const getInvalidFieldLabels = (formErrors: FieldErrors<UnitFormInput>) => {
    const fieldLabels: Partial<Record<keyof UnitFormInput, string>> = {
      name: t('fields.name'),
      short_name: t('fields.shortName'),
      allow_decimal: t('fields.allowDecimal'),
      sub_units: t('sections.subUnits'),
    }

    return Object.entries(fieldLabels)
      .filter(([field]) => Boolean(formErrors[field as keyof UnitFormInput]))
      .map(([, label]) => label)
  }

  const setValidationSummary = (fieldLabels: string[]) => {
    setServerError(
      fieldLabels.length > 0
        ? t('validation.fixFormErrorsWithFields', { fields: fieldLabels.join(', ') })
        : t('validation.fixFormErrors')
    )
  }

  const submitForm = async (formValues: UnitFormValues) => {
    setServerError('')

    try {
      await onSubmit(buildUnitPayload(formValues))
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof UnitFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  const handleInvalidSubmit = (formErrors: FieldErrors<UnitFormInput>) => {
    setValidationSummary(getInvalidFieldLabels(formErrors))

    const firstInvalidField = (['name', 'short_name'] as Array<keyof UnitFormInput>)
      .find((field) => Boolean(formErrors[field]))

    if (firstInvalidField) {
      setFocus(firstInvalidField)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="md">
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm, handleInvalidSubmit)}>
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
                name="short_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('fields.shortName')}
                    error={!!errors.short_name}
                    helperText={errors.short_name?.message}
                    required
                  />
                )}
              />
            </Box>

            <Controller
              name="allow_decimal"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                  label={t('fields.allowDecimal')}
                />
              )}
            />

            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
              >
                <Box>
                  <Typography variant="subtitle2">{t('sections.subUnits')}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('help.subUnits')}
                  </Typography>
                </Box>
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => append({ id: null, name: '', short_name: '', conversion_factor: 1 })}
                  disabled={isSaving}
                >
                  {t('actions.addSubUnit')}
                </Button>
              </Stack>

              {fields.length === 0 && (
                <Alert severity="info">{t('emptySubUnits')}</Alert>
              )}

              {fields.map((field, index) => (
                <Box
                  key={field.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr 1fr auto' },
                    gap: 1.5,
                    alignItems: 'start',
                  }}
                >
                  <Controller
                    name={`sub_units.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={t('fields.subUnitName')}
                        error={!!errors.sub_units?.[index]?.name}
                        helperText={errors.sub_units?.[index]?.name?.message}
                        required
                      />
                    )}
                  />

                  <Controller
                    name={`sub_units.${index}.short_name`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={t('fields.subUnitShortName')}
                        error={!!errors.sub_units?.[index]?.short_name}
                        helperText={errors.sub_units?.[index]?.short_name?.message}
                        required
                      />
                    )}
                  />

                  <Controller
                    name={`sub_units.${index}.conversion_factor`}
                    control={control}
                    render={({ field }) => {
                      const currentSubUnit = watchedSubUnits?.[index]
                      const dbId = currentSubUnit?.id
                      const isUsed = dbId ? usedSubUnitIds.has(dbId) : false
                      return (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          label={t('fields.conversionFactor')}
                          type="number"
                          error={!!errors.sub_units?.[index]?.conversion_factor}
                          helperText={
                            isUsed
                              ? t('fields.conversionFactorLocked')
                              : errors.sub_units?.[index]?.conversion_factor?.message
                          }
                          disabled={isUsed}
                          required
                          slotProps={{ htmlInput: { min: 0.0001, step: 0.0001 } }}
                        />
                      )
                    }}
                  />

                  <Tooltip title={t('actions.removeSubUnit')}>
                    <span>
                      <IconButton
                        color="error"
                        disabled={isSaving || (watchedSubUnits?.[index]?.id ? usedSubUnitIds.has(watchedSubUnits[index].id) : false)}
                        onClick={() => remove(index)}
                        sx={{ mt: { xs: 0, md: 1 } }}
                      >
                        <DeleteOutlined />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              ))}
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
