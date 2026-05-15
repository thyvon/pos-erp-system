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
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { priceGroupSchema, type PriceGroupFormInput, type PriceGroupFormValues } from './schema'
import type { PriceGroup, PriceGroupPayload } from '@/types/priceGroup'

interface PriceGroupFormDialogProps {
  open: boolean
  priceGroup: PriceGroup | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: PriceGroupPayload) => Promise<void>
}

const defaultValues: PriceGroupFormInput = {
  name: '',
  description: '',
  is_default: false,
}

function priceGroupToFormValues(priceGroup: PriceGroup | null): PriceGroupFormInput {
  if (!priceGroup) return defaultValues

  return {
    name: priceGroup.name,
    description: priceGroup.description ?? '',
    is_default: priceGroup.is_default,
  }
}

export function PriceGroupFormDialog({
  open,
  priceGroup,
  isSaving,
  onClose,
  onSubmit,
}: PriceGroupFormDialogProps) {
  const { t } = useTranslation(['priceGroups', 'common'])
  const [serverError, setServerError] = useState('')
  const title = priceGroup ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => priceGroupToFormValues(priceGroup), [priceGroup])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PriceGroupFormInput, unknown, PriceGroupFormValues>({
    resolver: zodResolver(priceGroupSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const submitForm = async (formValues: PriceGroupFormValues) => {
    setServerError('')

    try {
      await onSubmit(formValues)
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof PriceGroupFormInput, {
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
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('fields.description')}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  multiline
                  minRows={3}
                />
              )}
            />

            <Controller
              name="is_default"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label={t('fields.isDefault')}
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
