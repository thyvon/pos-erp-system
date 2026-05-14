'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, type FieldErrors, useForm } from 'react-hook-form'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { categorySchema, type CategoryFormInput, type CategoryFormValues } from './schema'
import type { Category, CategoryPayload } from '@/types/category'

interface CategoryFormDialogProps {
  open: boolean
  category: Category | null
  parentOptions: Category[]
  isLoadingParentOptions: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: CategoryPayload) => Promise<void>
}

const defaultValues: CategoryFormInput = {
  parent_id: '',
  name: '',
  code: '',
  short_code: '',
  image_url: '',
  sort_order: 0,
}

function categoryToFormValues(category: Category | null): CategoryFormInput {
  if (!category) return defaultValues

  return {
    parent_id: category.parent_id ?? '',
    name: category.name,
    code: category.code ?? '',
    short_code: category.short_code ?? '',
    image_url: category.image_url ?? '',
    sort_order: category.sort_order,
  }
}

function buildCategoryPayload(values: CategoryFormValues): CategoryPayload {
  return {
    parent_id: values.parent_id,
    name: values.name,
    code: values.code,
    short_code: values.short_code,
    image_url: values.image_url,
    sort_order: values.sort_order,
  }
}

export function CategoryFormDialog({
  open,
  category,
  parentOptions,
  isLoadingParentOptions,
  isSaving,
  onClose,
  onSubmit,
}: CategoryFormDialogProps) {
  const { t } = useTranslation(['categories', 'common'])
  const [serverError, setServerError] = useState('')
  const title = category ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => categoryToFormValues(category), [category])
  const availableParentOptions = useMemo(
    () => parentOptions.filter((parent) => parent.id !== category?.id),
    [category?.id, parentOptions]
  )

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const getInvalidFieldLabels = (formErrors: FieldErrors<CategoryFormInput>) => {
    const fieldLabels: Partial<Record<keyof CategoryFormInput, string>> = {
      parent_id: t('fields.parent'),
      name: t('fields.name'),
      code: t('fields.code'),
      short_code: t('fields.shortCode'),
      image_url: t('fields.imageUrl'),
      sort_order: t('fields.sortOrder'),
    }

    return Object.entries(fieldLabels)
      .filter(([field]) => Boolean(formErrors[field as keyof CategoryFormInput]))
      .map(([, label]) => label)
  }

  const setValidationSummary = (fieldLabels: string[]) => {
    setServerError(
      fieldLabels.length > 0
        ? t('validation.fixFormErrorsWithFields', { fields: fieldLabels.join(', ') })
        : t('validation.fixFormErrors')
    )
  }

  const submitForm = async (formValues: CategoryFormValues) => {
    setServerError('')

    try {
      await onSubmit(buildCategoryPayload(formValues))
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof CategoryFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  const handleInvalidSubmit = (formErrors: FieldErrors<CategoryFormInput>) => {
    setValidationSummary(getInvalidFieldLabels(formErrors))

    const focusOrder: Array<keyof CategoryFormInput> = [
      'parent_id',
      'name',
      'code',
      'short_code',
      'image_url',
      'sort_order',
    ]
    const firstInvalidField = focusOrder.find((field) => Boolean(formErrors[field]))

    if (firstInvalidField) {
      setFocus(firstInvalidField)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm">
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

            <Controller
              name="parent_id"
              control={control}
              render={({ field }) => {
                const selectedParent =
                  availableParentOptions.find((parent) => parent.id === field.value) ?? null

                return (
                  <Autocomplete
                    options={availableParentOptions}
                    value={selectedParent}
                    loading={isLoadingParentOptions}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_, option) => field.onChange(option?.id ?? '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('fields.parent')}
                        error={!!errors.parent_id}
                        helperText={errors.parent_id?.message || t('help.parent')}
                      />
                    )}
                  />
                )
              }}
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.code')}
                    error={!!errors.code}
                    helperText={errors.code?.message}
                  />
                )}
              />

              <Controller
                name="short_code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.shortCode')}
                    error={!!errors.short_code}
                    helperText={errors.short_code?.message}
                  />
                )}
              />
            </Box>

            <Controller
              name="image_url"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('fields.imageUrl')}
                  error={!!errors.image_url}
                  helperText={errors.image_url?.message}
                />
              )}
            />

            <Controller
              name="sort_order"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('fields.sortOrder')}
                  type="number"
                  error={!!errors.sort_order}
                  helperText={errors.sort_order?.message}
                  slotProps={{ htmlInput: { min: 0, max: 65535, step: 1 } }}
                />
              )}
            />
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
