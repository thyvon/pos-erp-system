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
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { customerGroupSchema, type CustomerGroupFormInput, type CustomerGroupFormValues } from './schema'
import type { CustomerGroup, CustomerGroupPayload } from '@/types/customerGroup'
import type { PriceGroup } from '@/types/priceGroup'

interface CustomerGroupFormDialogProps {
  open: boolean
  customerGroup: CustomerGroup | null
  priceGroups: PriceGroup[]
  isLoadingPriceGroups: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: CustomerGroupPayload) => Promise<void>
}

const defaultValues: CustomerGroupFormInput = {
  name: '',
  discount: 0,
  price_group_id: '',
}

function customerGroupToFormValues(customerGroup: CustomerGroup | null): CustomerGroupFormInput {
  if (!customerGroup) return defaultValues

  return {
    name: customerGroup.name,
    discount: customerGroup.discount,
    price_group_id: customerGroup.price_group_id ?? '',
  }
}

export function CustomerGroupFormDialog({
  open,
  customerGroup,
  priceGroups,
  isLoadingPriceGroups,
  isSaving,
  onClose,
  onSubmit,
}: CustomerGroupFormDialogProps) {
  const { t } = useTranslation(['customerGroups', 'common'])
  const [serverError, setServerError] = useState('')
  const title = customerGroup ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => customerGroupToFormValues(customerGroup), [customerGroup])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CustomerGroupFormInput, unknown, CustomerGroupFormValues>({
    resolver: zodResolver(customerGroupSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const submitForm = async (formValues: CustomerGroupFormValues) => {
    setServerError('')

    try {
      await onSubmit(formValues)
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof CustomerGroupFormInput, {
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

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Controller
                name="discount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.discount')}
                    type="number"
                    error={!!errors.discount}
                    helperText={errors.discount?.message}
                    slotProps={{ htmlInput: { min: 0, max: 100, step: '0.01' } }}
                    required
                  />
                )}
              />

              <Controller
                name="price_group_id"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.price_group_id}>
                    <InputLabel id="customer-group-price-group-label">{t('fields.priceGroup')}</InputLabel>
                    <Select
                      {...field}
                      value={field.value ?? ''}
                      labelId="customer-group-price-group-label"
                      label={t('fields.priceGroup')}
                      disabled={isLoadingPriceGroups}
                    >
                      <MenuItem value="">{t('placeholders.noPriceGroup')}</MenuItem>
                      {priceGroups.map((priceGroup) => (
                        <MenuItem key={priceGroup.id} value={priceGroup.id}>
                          {priceGroup.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.price_group_id?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Box>
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
