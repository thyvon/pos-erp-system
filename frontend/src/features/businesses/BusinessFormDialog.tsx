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
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import {
  managedBusinessSchema,
  type ManagedBusinessFormInput,
  type ManagedBusinessFormValues,
} from './schema'
import type { ManagedBusiness, ManagedBusinessPayload } from '@/types/businessManagement'

interface BusinessFormDialogProps {
  open: boolean
  business: ManagedBusiness | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: ManagedBusinessPayload) => Promise<void>
}

const defaultValues: ManagedBusinessFormInput = {
  name: '',
  legal_name: '',
  tax_id: '',
  email: '',
  phone: '',
  currency: 'USD',
  timezone: 'Asia/Phnom_Penh',
  country: 'KH',
  locale: 'en',
  logo_url: '',
  tier: 'basic',
  status: 'active',
  max_users: '5',
  max_branches: '1',
  address_line1: '',
  address_line2: '',
  address_city: '',
  address_state: '',
  address_postal_code: '',
  address_country: 'KH',
  financial_year_start_month: '1',
  financial_year_start_day: '1',
  owner_first_name: '',
  owner_last_name: '',
  owner_email: '',
  owner_phone: '',
  owner_password: '',
}

const fieldMap: Record<string, keyof ManagedBusinessFormInput> = {
  'owner.first_name': 'owner_first_name',
  'owner.last_name': 'owner_last_name',
  'owner.email': 'owner_email',
  'owner.phone': 'owner_phone',
  'owner.password': 'owner_password',
  'address.line1': 'address_line1',
  'address.line2': 'address_line2',
  'address.city': 'address_city',
  'address.state': 'address_state',
  'address.postal_code': 'address_postal_code',
  'address.country': 'address_country',
  'financial_year.start_month': 'financial_year_start_month',
  'financial_year.start_day': 'financial_year_start_day',
}

function businessToFormValues(business: ManagedBusiness | null): ManagedBusinessFormInput {
  if (!business) return defaultValues

  return {
    ...defaultValues,
    name: business.name ?? '',
    legal_name: business.legal_name ?? '',
    tax_id: business.tax_id ?? '',
    email: business.email ?? '',
    phone: business.phone ?? '',
    currency: business.currency ?? 'USD',
    timezone: business.timezone ?? 'Asia/Phnom_Penh',
    country: business.country ?? '',
    locale: business.locale === 'km' ? 'km' : 'en',
    logo_url: business.logo_url ?? '',
    tier: business.tier,
    status: business.status,
    max_users: String(business.max_users ?? 1),
    max_branches: String(business.max_branches ?? 1),
    address_line1: business.address?.line1 ?? '',
    address_line2: business.address?.line2 ?? '',
    address_city: business.address?.city ?? '',
    address_state: business.address?.state ?? '',
    address_postal_code: business.address?.postal_code ?? '',
    address_country: business.address?.country ?? '',
    financial_year_start_month: business.financial_year?.start_month
      ? String(business.financial_year.start_month)
      : '',
    financial_year_start_day: business.financial_year?.start_day
      ? String(business.financial_year.start_day)
      : '',
  }
}

function hasAddress(values: ManagedBusinessFormValues) {
  return Boolean(
    values.address_line1
      || values.address_line2
      || values.address_city
      || values.address_state
      || values.address_postal_code
      || values.address_country
  )
}

function buildPayload(values: ManagedBusinessFormValues, isCreate: boolean): ManagedBusinessPayload {
  const payload: ManagedBusinessPayload = {
    name: values.name.trim(),
    legal_name: values.legal_name,
    tax_id: values.tax_id,
    email: values.email.trim(),
    phone: values.phone,
    currency: values.currency,
    timezone: values.timezone.trim(),
    country: values.country,
    locale: values.locale,
    logo_url: values.logo_url,
    tier: values.tier,
    status: values.status,
    max_users: values.max_users,
    max_branches: values.max_branches,
    address: hasAddress(values)
      ? {
          line1: values.address_line1,
          line2: values.address_line2,
          city: values.address_city,
          state: values.address_state,
          postal_code: values.address_postal_code,
          country: values.address_country,
        }
      : null,
    financial_year: values.financial_year_start_month || values.financial_year_start_day
      ? {
          start_month: values.financial_year_start_month,
          start_day: values.financial_year_start_day,
        }
      : null,
  }

  if (isCreate) {
    payload.owner = {
      first_name: values.owner_first_name.trim(),
      last_name: values.owner_last_name,
      email: values.owner_email.trim(),
      phone: values.owner_phone,
      password: values.owner_password,
    }
  }

  return payload
}

export function BusinessFormDialog({
  open,
  business,
  isSaving,
  onClose,
  onSubmit,
}: BusinessFormDialogProps) {
  const { t } = useTranslation(['businesses', 'common'])
  const [serverError, setServerError] = useState('')
  const values = useMemo(() => businessToFormValues(business), [business])
  const isCreate = !business
  const title = isCreate ? t('form.createTitle') : t('form.editTitle')

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ManagedBusinessFormInput, unknown, ManagedBusinessFormValues>({
    resolver: zodResolver(managedBusinessSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const submitForm = async (formValues: ManagedBusinessFormValues) => {
    setServerError('')

    if (isCreate) {
      if (!formValues.owner_first_name.trim()) {
        setError('owner_first_name', { type: 'manual', message: t('validation.ownerFirstNameRequired') })
        return
      }

      if (!formValues.owner_email.trim()) {
        setError('owner_email', { type: 'manual', message: t('validation.ownerEmailRequired') })
        return
      }

      if (formValues.owner_password.length < 8) {
        setError('owner_password', { type: 'manual', message: t('validation.ownerPasswordMin') })
        return
      }
    }

    try {
      await onSubmit(buildPayload(formValues, isCreate))
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)

      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError((fieldMap[field] ?? field) as keyof ManagedBusinessFormInput, {
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
          <Stack spacing={3} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <Stack spacing={2}>
              <Typography variant="subtitle1">{t('sections.profile')}</Typography>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
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
                  name="legal_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      label={t('fields.legalName')}
                      error={!!errors.legal_name}
                      helperText={errors.legal_name?.message}
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('fields.email')}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      required
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
                  name="logo_url"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      label={t('fields.logoUrl')}
                      error={!!errors.logo_url}
                      helperText={errors.logo_url?.message}
                    />
                  )}
                />
              </Box>
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Typography variant="subtitle1">{t('sections.configuration')}</Typography>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
                <Controller
                  name="tier"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label={t('fields.tier')} error={!!errors.tier} helperText={errors.tier?.message}>
                      <MenuItem value="basic">{t('tiers.basic')}</MenuItem>
                      <MenuItem value="standard">{t('tiers.standard')}</MenuItem>
                      <MenuItem value="enterprise">{t('tiers.enterprise')}</MenuItem>
                    </TextField>
                  )}
                />
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label={t('fields.status')} error={!!errors.status} helperText={errors.status?.message}>
                      <MenuItem value="active">{t('statuses.active')}</MenuItem>
                      <MenuItem value="suspended">{t('statuses.suspended')}</MenuItem>
                      <MenuItem value="cancelled">{t('statuses.cancelled')}</MenuItem>
                    </TextField>
                  )}
                />
                <Controller
                  name="locale"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label={t('fields.locale')} error={!!errors.locale} helperText={errors.locale?.message}>
                      <MenuItem value="en">{t('locales.en')}</MenuItem>
                      <MenuItem value="km">{t('locales.km')}</MenuItem>
                    </TextField>
                  )}
                />
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label={t('fields.currency')} error={!!errors.currency} helperText={errors.currency?.message} required />
                  )}
                />
                <Controller
                  name="timezone"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label={t('fields.timezone')} error={!!errors.timezone} helperText={errors.timezone?.message} required />
                  )}
                />
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} value={field.value ?? ''} label={t('fields.country')} error={!!errors.country} helperText={errors.country?.message} />
                  )}
                />
                <Controller
                  name="max_users"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label={t('fields.maxUsers')} error={!!errors.max_users} helperText={errors.max_users?.message} required />
                  )}
                />
                <Controller
                  name="max_branches"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label={t('fields.maxBranches')} error={!!errors.max_branches} helperText={errors.max_branches?.message} required />
                  )}
                />
              </Box>
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Typography variant="subtitle1">{t('sections.address')}</Typography>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                <Controller name="address_line1" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={t('fields.addressLine1')} error={!!errors.address_line1} helperText={errors.address_line1?.message} />
                )} />
                <Controller name="address_line2" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={t('fields.addressLine2')} error={!!errors.address_line2} helperText={errors.address_line2?.message} />
                )} />
                <Controller name="address_city" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={t('fields.city')} error={!!errors.address_city} helperText={errors.address_city?.message} />
                )} />
                <Controller name="address_state" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={t('fields.state')} error={!!errors.address_state} helperText={errors.address_state?.message} />
                )} />
                <Controller name="address_postal_code" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={t('fields.postalCode')} error={!!errors.address_postal_code} helperText={errors.address_postal_code?.message} />
                )} />
                <Controller name="address_country" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={t('fields.addressCountry')} error={!!errors.address_country} helperText={errors.address_country?.message} />
                )} />
              </Box>
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Typography variant="subtitle1">{t('sections.financialYear')}</Typography>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                <Controller name="financial_year_start_month" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={t('fields.financialYearStartMonth')} error={!!errors.financial_year_start_month} helperText={errors.financial_year_start_month?.message} />
                )} />
                <Controller name="financial_year_start_day" control={control} render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} label={t('fields.financialYearStartDay')} error={!!errors.financial_year_start_day} helperText={errors.financial_year_start_day?.message} />
                )} />
              </Box>
            </Stack>

            {isCreate && (
              <>
                <Divider />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle1">{t('sections.owner')}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('form.ownerHelp')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Controller name="owner_first_name" control={control} render={({ field }) => (
                      <TextField {...field} label={t('fields.ownerFirstName')} error={!!errors.owner_first_name} helperText={errors.owner_first_name?.message} required />
                    )} />
                    <Controller name="owner_last_name" control={control} render={({ field }) => (
                      <TextField {...field} value={field.value ?? ''} label={t('fields.ownerLastName')} error={!!errors.owner_last_name} helperText={errors.owner_last_name?.message} />
                    )} />
                    <Controller name="owner_email" control={control} render={({ field }) => (
                      <TextField {...field} label={t('fields.ownerEmail')} error={!!errors.owner_email} helperText={errors.owner_email?.message} required />
                    )} />
                    <Controller name="owner_phone" control={control} render={({ field }) => (
                      <TextField {...field} value={field.value ?? ''} label={t('fields.ownerPhone')} error={!!errors.owner_phone} helperText={errors.owner_phone?.message} />
                    )} />
                    <Controller name="owner_password" control={control} render={({ field }) => (
                      <TextField {...field} type="password" label={t('fields.ownerPassword')} error={!!errors.owner_password} helperText={errors.owner_password?.message || t('form.ownerPasswordHelp')} required />
                    )} />
                  </Box>
                </Stack>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose} disabled={isSaving}>
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
