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
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { customerSchema, type CustomerFormInput, type CustomerFormValues } from './schema'
import type { Customer, CustomerPayload } from '@/types/customer'

interface CustomerFormDialogProps {
  open: boolean
  customer: Customer | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: CustomerPayload) => Promise<void>
}

const defaultValues: CustomerFormInput = {
  name: '',
  type: 'individual',
  email: '',
  phone: '',
  mobile: '',
  tax_id: '',
  credit_limit: 0,
  pay_term: 0,
  opening_balance: 0,
  status: 'active',
  notes: '',
}

function customerToFormValues(customer: Customer | null): CustomerFormInput {
  if (!customer) return defaultValues

  return {
    name: customer.name,
    type: customer.type,
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    mobile: customer.mobile ?? '',
    tax_id: customer.tax_id ?? '',
    credit_limit: customer.credit_limit,
    pay_term: customer.pay_term,
    opening_balance: customer.opening_balance,
    status: customer.status,
    notes: customer.notes ?? '',
  }
}

export function CustomerFormDialog({
  open,
  customer,
  isSaving,
  onClose,
  onSubmit,
}: CustomerFormDialogProps) {
  const { t } = useTranslation(['customers', 'common'])
  const [serverError, setServerError] = useState('')
  const title = customer ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => customerToFormValues(customer), [customer])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CustomerFormInput, unknown, CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const submitForm = async (formValues: CustomerFormValues) => {
    setServerError('')

    try {
      await onSubmit(formValues)
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof CustomerFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="md">
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
                    <InputLabel id="customer-type-label">{t('fields.type')}</InputLabel>
                    <Select {...field} labelId="customer-type-label" label={t('fields.type')}>
                      <MenuItem value="individual">{t('type.individual')}</MenuItem>
                      <MenuItem value="company">{t('type.company')}</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.email')}
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.phone')}
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                )}
              />

              <Controller
                name="mobile"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.mobile')}
                    error={!!errors.mobile}
                    helperText={errors.mobile?.message}
                  />
                )}
              />

              <Controller
                name="tax_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.taxId')}
                    error={!!errors.tax_id}
                    helperText={errors.tax_id?.message}
                  />
                )}
              />

              <Controller
                name="credit_limit"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.creditLimit')}
                    type="number"
                    error={!!errors.credit_limit}
                    helperText={errors.credit_limit?.message}
                    slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                  />
                )}
              />

              <Controller
                name="pay_term"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.payTerm')}
                    type="number"
                    error={!!errors.pay_term}
                    helperText={errors.pay_term?.message}
                    slotProps={{ htmlInput: { min: 0, max: 3650, step: 1 } }}
                  />
                )}
              />

              <Controller
                name="opening_balance"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.openingBalance')}
                    type="number"
                    error={!!errors.opening_balance}
                    helperText={errors.opening_balance?.message}
                    slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                  />
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.status}>
                    <InputLabel id="customer-status-label">{t('fields.status')}</InputLabel>
                    <Select {...field} labelId="customer-status-label" label={t('fields.status')}>
                      <MenuItem value="active">{t('common:status.active')}</MenuItem>
                      <MenuItem value="inactive">{t('common:status.inactive')}</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('fields.notes')}
                  multiline
                  minRows={3}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
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
