'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, type FieldErrors, useFieldArray, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Add, DeleteOutlined } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import {
  variationTemplateSchema,
  type VariationTemplateFormInput,
  type VariationTemplateFormValues,
} from './schema'
import type { VariationTemplate, VariationTemplatePayload } from '@/types/variationTemplate'

interface VariationTemplateFormDialogProps {
  open: boolean
  template: VariationTemplate | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: VariationTemplatePayload) => Promise<void>
}

const defaultValues: VariationTemplateFormInput = {
  name: '',
  values: [{ id: null, name: '', sort_order: 10 }],
}

function templateToFormValues(template: VariationTemplate | null): VariationTemplateFormInput {
  if (!template) return defaultValues

  return {
    name: template.name,
    values: template.values.map((value, index) => ({
      id: value.id,
      name: value.name,
      sort_order: value.sort_order ?? (index + 1) * 10,
    })),
  }
}

function buildVariationTemplatePayload(
  values: VariationTemplateFormValues
): VariationTemplatePayload {
  return {
    name: values.name,
    values: values.values.map((value) => ({
      id: value.id ?? null,
      name: value.name,
      sort_order: value.sort_order,
    })),
  }
}

export function VariationTemplateFormDialog({
  open,
  template,
  isSaving,
  onClose,
  onSubmit,
}: VariationTemplateFormDialogProps) {
  const { t } = useTranslation(['variationTemplates', 'common'])
  const [serverError, setServerError] = useState('')
  const title = template ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => templateToFormValues(template), [template])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<VariationTemplateFormInput, unknown, VariationTemplateFormValues>({
    resolver: zodResolver(variationTemplateSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'values',
    keyName: 'fieldId',
  })

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const getInvalidFieldLabels = (formErrors: FieldErrors<VariationTemplateFormInput>) => {
    const fieldLabels: Partial<Record<keyof VariationTemplateFormInput, string>> = {
      name: t('fields.name'),
      values: t('sections.values'),
    }

    return Object.entries(fieldLabels)
      .filter(([field]) => Boolean(formErrors[field as keyof VariationTemplateFormInput]))
      .map(([, label]) => label)
  }

  const submitForm = async (formValues: VariationTemplateFormValues) => {
    setServerError('')

    try {
      await onSubmit(buildVariationTemplatePayload(formValues))
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof VariationTemplateFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  const handleInvalidSubmit = (formErrors: FieldErrors<VariationTemplateFormInput>) => {
    const fieldsWithErrors = getInvalidFieldLabels(formErrors)
    setServerError(
      fieldsWithErrors.length > 0
        ? t('validation.fixFormErrorsWithFields', { fields: fieldsWithErrors.join(', ') })
        : t('validation.fixFormErrors')
    )

    if (formErrors.name) setFocus('name')
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="md">
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm, handleInvalidSubmit)}>
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

            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
              >
                <Box>
                  <Typography variant="subtitle2">{t('sections.values')}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('help.values')}
                  </Typography>
                </Box>
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() =>
                    append({ id: null, name: '', sort_order: (fields.length + 1) * 10 })
                  }
                  disabled={isSaving}
                >
                  {t('actions.addValue')}
                </Button>
              </Stack>

              {fields.length === 0 && <Alert severity="info">{t('emptyValues')}</Alert>}

              {fields.map((field, index) => (
                <Box
                  key={field.fieldId}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.5fr 160px auto' },
                    gap: 1.5,
                    alignItems: 'start',
                  }}
                >
                  <Controller
                    name={`values.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={t('fields.valueName')}
                        error={!!errors.values?.[index]?.name}
                        helperText={errors.values?.[index]?.name?.message}
                        required
                      />
                    )}
                  />

                  <Controller
                    name={`values.${index}.sort_order`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        label={t('fields.sortOrder')}
                        type="number"
                        error={!!errors.values?.[index]?.sort_order}
                        helperText={errors.values?.[index]?.sort_order?.message}
                        slotProps={{ htmlInput: { min: 0, max: 65535, step: 1 } }}
                      />
                    )}
                  />

                  <Tooltip title={t('actions.removeValue')}>
                    <span>
                      <IconButton
                        color="error"
                        disabled={isSaving || fields.length <= 1}
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
        <DialogActions sx={{ px: 3, py: 2 }}>
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
