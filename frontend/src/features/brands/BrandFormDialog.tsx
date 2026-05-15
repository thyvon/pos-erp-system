'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, type FieldErrors, useForm } from 'react-hook-form'
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
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppImageUpload } from '@/components/ui/AppImageUpload'
import { brandSchema, type BrandFormInput, type BrandFormValues } from './schema'
import type { Brand, BrandPayload } from '@/types/brand'

interface BrandFormDialogProps {
  open: boolean
  brand: Brand | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: BrandPayload) => Promise<void>
}

const defaultValues: BrandFormInput = {
  name: '',
  description: '',
  image_url: '',
  image_file: null,
}

function brandToFormValues(brand: Brand | null): BrandFormInput {
  if (!brand) return defaultValues

  return {
    name: brand.name,
    description: brand.description ?? '',
    image_url: brand.image_url ?? '',
    image_file: null,
  }
}

function buildBrandPayload(values: BrandFormValues): BrandPayload {
  return {
    name: values.name,
    description: values.description,
    image_url: values.image_url,
    image_file: values.image_file,
  }
}

export function BrandFormDialog({
  open,
  brand,
  isSaving,
  onClose,
  onSubmit,
}: BrandFormDialogProps) {
  const { t } = useTranslation(['brands', 'common'])
  const [serverError, setServerError] = useState('')
  const title = brand ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => brandToFormValues(brand), [brand])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<BrandFormInput, unknown, BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const getInvalidFieldLabels = (formErrors: FieldErrors<BrandFormInput>) => {
    const fieldLabels: Partial<Record<keyof BrandFormInput, string>> = {
      name: t('fields.name'),
      description: t('fields.description'),
      image_url: t('fields.imageUrl'),
      image_file: t('fields.imageFile'),
    }

    return Object.entries(fieldLabels)
      .filter(([field]) => Boolean(formErrors[field as keyof BrandFormInput]))
      .map(([, label]) => label)
  }

  const setValidationSummary = (fieldLabels: string[]) => {
    setServerError(
      fieldLabels.length > 0
        ? t('validation.fixFormErrorsWithFields', { fields: fieldLabels.join(', ') })
        : t('validation.fixFormErrors')
    )
  }

  const submitForm = async (formValues: BrandFormValues) => {
    setServerError('')

    try {
      await onSubmit(buildBrandPayload(formValues))
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof BrandFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  const handleInvalidSubmit = (formErrors: FieldErrors<BrandFormInput>) => {
    setValidationSummary(getInvalidFieldLabels(formErrors))

    const firstInvalidField = (['name', 'description', 'image_url'] as Array<keyof BrandFormInput>)
      .find((field) => Boolean(formErrors[field]))

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
              name="image_file"
              control={control}
              render={({ field: fileField }) => (
                <Controller
                  name="image_url"
                  control={control}
                  render={({ field: urlField }) => (
                    <AppImageUpload
                      label={t('fields.imageFile')}
                      value={urlField.value ?? ''}
                      file={fileField.value}
                      onUrlChange={urlField.onChange}
                      onFileChange={fileField.onChange}
                      error={!!errors.image_url || !!errors.image_file}
                      helperText={errors.image_url?.message || errors.image_file?.message}
                      urlLabel={t('fields.imageUrl')}
                      uploadLabel={t('buttons.uploadImage')}
                      removeLabel={t('buttons.removeImage')}
                      hideUrlField
                      disabled={isSaving}
                    />
                  )}
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
