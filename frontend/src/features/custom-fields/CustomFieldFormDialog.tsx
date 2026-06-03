'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
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
import { customFieldSchema, type CustomFieldFormInput, type CustomFieldFormValues } from './schema'
import type { CustomFieldDefinition, CustomFieldPayload } from '@/types/customField'

interface CustomFieldFormDialogProps {
  open: boolean
  customField: CustomFieldDefinition | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: CustomFieldPayload) => Promise<void>
}

const defaultValues: CustomFieldFormInput = {
  module: 'customer',
  field_name: '',
  field_label: '',
  field_type: 'text',
  options_text: '',
  is_required: false,
  sort_order: 0,
}

function definitionToFormValues(customField: CustomFieldDefinition | null): CustomFieldFormInput {
  if (!customField) return defaultValues

  return {
    module: customField.module,
    field_name: customField.field_name,
    field_label: customField.field_label,
    field_type: customField.field_type,
    options_text: customField.options?.join('\n') ?? '',
    is_required: customField.is_required,
    sort_order: customField.sort_order,
  }
}

function parseOptions(value: string) {
  return value
    .split(/\r?\n/)
    .map((option) => option.trim())
    .filter(Boolean)
}

export function CustomFieldFormDialog({
  open,
  customField,
  isSaving,
  onClose,
  onSubmit,
}: CustomFieldFormDialogProps) {
  const { t } = useTranslation(['customFields', 'common'])
  const [serverError, setServerError] = useState('')
  const title = customField ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => definitionToFormValues(customField), [customField])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CustomFieldFormInput, unknown, CustomFieldFormValues>({
    resolver: zodResolver(customFieldSchema),
    defaultValues,
  })

  const fieldType = useWatch({ control, name: 'field_type' })

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const submitForm = async (formValues: CustomFieldFormValues) => {
    setServerError('')

    const payload: CustomFieldPayload = {
      module: formValues.module,
      field_name: formValues.field_name,
      field_label: formValues.field_label,
      field_type: formValues.field_type,
      options: formValues.field_type === 'select' ? parseOptions(formValues.options_text) : null,
      is_required: formValues.is_required,
      sort_order: formValues.sort_order,
    }

    try {
      await onSubmit(payload)
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          const formField = field === 'options' ? 'options_text' : field
          setError(formField as keyof CustomFieldFormInput, {
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
      <Box component="form" onSubmit={handleSubmit(submitForm)}>
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
                name="module"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.module}>
                    <InputLabel id="custom-field-module-label">{t('fields.module')}</InputLabel>
                    <Select {...field} labelId="custom-field-module-label" label={t('fields.module')}>
                      <MenuItem value="product">{t('module.product')}</MenuItem>
                      <MenuItem value="customer">{t('module.customer')}</MenuItem>
                      <MenuItem value="supplier">{t('module.supplier')}</MenuItem>
                    </Select>
                    <FormHelperText>{errors.module?.message}</FormHelperText>
                  </FormControl>
                )}
              />

              <Controller
                name="field_type"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.field_type}>
                    <InputLabel id="custom-field-type-label">{t('fields.fieldType')}</InputLabel>
                    <Select {...field} labelId="custom-field-type-label" label={t('fields.fieldType')}>
                      <MenuItem value="text">{t('fieldType.text')}</MenuItem>
                      <MenuItem value="number">{t('fieldType.number')}</MenuItem>
                      <MenuItem value="date">{t('fieldType.date')}</MenuItem>
                      <MenuItem value="select">{t('fieldType.select')}</MenuItem>
                      <MenuItem value="checkbox">{t('fieldType.checkbox')}</MenuItem>
                    </Select>
                    <FormHelperText>{errors.field_type?.message}</FormHelperText>
                  </FormControl>
                )}
              />

              <Controller
                name="field_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('fields.fieldName')}
                    error={!!errors.field_name}
                    helperText={errors.field_name?.message || t('help.fieldName')}
                    required
                  />
                )}
              />

              <Controller
                name="field_label"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('fields.fieldLabel')}
                    error={!!errors.field_label}
                    helperText={errors.field_label?.message}
                    required
                  />
                )}
              />

              <Controller
                name="sort_order"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t('fields.sortOrder')}
                    error={!!errors.sort_order}
                    helperText={errors.sort_order?.message}
                    slotProps={{ htmlInput: { min: 0, max: 999 } }}
                  />
                )}
              />
            </Box>

            {fieldType === 'select' && (
              <Controller
                name="options_text"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('fields.options')}
                    placeholder={t('placeholders.options')}
                    error={!!errors.options_text}
                    helperText={errors.options_text?.message || t('help.options')}
                    multiline
                    minRows={4}
                  />
                )}
              />
            )}

            <Controller
              name="is_required"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                  label={t('fields.required')}
                />
              )}
            />
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
