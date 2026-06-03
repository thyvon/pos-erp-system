'use client'

import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { SaveOutlined } from '@/components/ui/icons'
import { toAppApiError } from '@/api/errors'
import { CambodiaAddressFields } from '@/components/ui/CambodiaAddressFields'
import { useBusinessProfileQuery, useUpdateBusinessProfileMutation } from './hooks'
import {
  businessProfileSchema,
  type BusinessProfileFormInput,
  type BusinessProfileFormValues,
} from './businessProfileSchema'
import type { BusinessProfile, BusinessProfilePayload } from '@/types/businessProfile'

interface BusinessProfileSettingsCardProps {
  canView: boolean
  canEdit: boolean
}

const defaultValues: BusinessProfileFormInput = {
  name: '',
  legal_name: '',
  tax_id: '',
  email: '',
  phone: '',
  business_country: '',
  logo_url: '',
  address_line1: '',
  address_line2: '',
  country: 'Cambodia',
  province_city: '',
  district: '',
  commune: '',
  village: '',
}

function businessToFormValues(business: BusinessProfile | undefined): BusinessProfileFormInput {
  if (!business) return defaultValues

  return {
    name: business.name ?? '',
    legal_name: business.legal_name ?? '',
    tax_id: business.tax_id ?? '',
    email: business.email ?? '',
    phone: business.phone ?? '',
    business_country: business.country ?? '',
    logo_url: business.logo_url ?? '',
    address_line1: business.address?.line1 ?? '',
    address_line2: business.address?.line2 ?? '',
    country: business.address?.country ?? 'Cambodia',
    province_city: business.address?.province_city ?? business.address?.city ?? business.address?.state ?? '',
    district: business.address?.district ?? '',
    commune: business.address?.commune ?? '',
    village: business.address?.village ?? '',
  }
}

function hasAddress(values: BusinessProfileFormValues) {
  return Boolean(
    values.address_line1
      || values.address_line2
      || values.country
      || values.province_city
      || values.district
      || values.commune
      || values.village
  )
}

function buildPayload(values: BusinessProfileFormValues): BusinessProfilePayload {
  return {
    name: values.name.trim(),
    legal_name: values.legal_name,
    tax_id: values.tax_id,
    email: values.email.trim(),
    phone: values.phone,
    country: values.business_country,
    logo_url: values.logo_url,
    address: hasAddress(values)
      ? {
          line1: values.address_line1,
          line2: values.address_line2,
          village: values.village,
          commune: values.commune,
          district: values.district,
          province_city: values.province_city,
          country: values.country,
        }
      : null,
  }
}

export function BusinessProfileSettingsCard({ canView, canEdit }: BusinessProfileSettingsCardProps) {
  const { t } = useTranslation(['settings', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const businessQuery = useBusinessProfileQuery(canView)
  const updateBusiness = useUpdateBusinessProfileMutation()
  const values = useMemo(() => businessToFormValues(businessQuery.data), [businessQuery.data])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<BusinessProfileFormInput, unknown, BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues,
  })

  useEffect(() => {
    reset(values)
  }, [reset, values])

  const submitForm = async (formValues: BusinessProfileFormValues) => {
    try {
      await updateBusiness.mutateAsync(buildPayload(formValues))
      enqueueSnackbar(t('businessProfile.saved'), { variant: 'success' })
    } catch (error) {
      const apiError = toAppApiError(error)

      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          const fieldName = field
            .replace('address.line1', 'address_line1')
            .replace('address.line2', 'address_line2')
            .replace('address.', '') as keyof BusinessProfileFormInput

          setError(fieldName, {
            type: 'server',
            message: messages[0],
          })
        })
      }

      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  if (!canView) return null

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', md: 'flex-start' }, justifyContent: 'space-between' }}
          >
            <Box>
              <Typography variant="h6">{t('businessProfile.title')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {t('businessProfile.description')}
              </Typography>
            </Box>
            {businessQuery.data && (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Chip size="small" label={t('businessProfile.plan', { tier: businessQuery.data.tier })} />
                <Chip size="small" label={t('businessProfile.status', { status: businessQuery.data.status })} />
                <Chip
                  size="small"
                  label={t('businessProfile.usage', {
                    users: businessQuery.data.usage.users_count,
                    maxUsers: businessQuery.data.max_users,
                    branches: businessQuery.data.usage.branches_count,
                    maxBranches: businessQuery.data.max_branches,
                  })}
                />
              </Stack>
            )}
          </Stack>

          {businessQuery.isError && (
            <Alert severity="error">{toAppApiError(businessQuery.error).message}</Alert>
          )}

          {businessQuery.isLoading ? (
            <Stack sx={{ alignItems: 'center', py: 4 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <Box component="form" onSubmit={handleSubmit(submitForm)}>
              <Stack spacing={2.5}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    gap: 2,
                  }}
                >
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={t('businessProfile.fields.name')}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        disabled={!canEdit || updateBusiness.isPending}
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
                        label={t('businessProfile.fields.legalName')}
                        error={!!errors.legal_name}
                        helperText={errors.legal_name?.message}
                        disabled={!canEdit || updateBusiness.isPending}
                      />
                    )}
                  />
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={t('businessProfile.fields.email')}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        disabled={!canEdit || updateBusiness.isPending}
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
                        label={t('businessProfile.fields.phone')}
                        error={!!errors.phone}
                        helperText={errors.phone?.message}
                        disabled={!canEdit || updateBusiness.isPending}
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
                        label={t('businessProfile.fields.taxId')}
                        error={!!errors.tax_id}
                        helperText={errors.tax_id?.message}
                        disabled={!canEdit || updateBusiness.isPending}
                      />
                    )}
                  />
                  <Controller
                    name="business_country"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        label={t('businessProfile.fields.country')}
                        error={!!errors.business_country}
                        helperText={errors.business_country?.message}
                        disabled={!canEdit || updateBusiness.isPending}
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
                        label={t('businessProfile.fields.logoUrl')}
                        error={!!errors.logo_url}
                        helperText={errors.logo_url?.message}
                        disabled={!canEdit || updateBusiness.isPending}
                      />
                    )}
                  />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                    {t('businessProfile.addressTitle')}
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Controller name="address_line1" control={control} render={({ field }) => (
                      <TextField {...field} value={field.value ?? ''} label={t('businessProfile.fields.addressLine1')} error={!!errors.address_line1} helperText={errors.address_line1?.message} disabled={!canEdit || updateBusiness.isPending} />
                    )} />
                    <Controller name="address_line2" control={control} render={({ field }) => (
                      <TextField {...field} value={field.value ?? ''} label={t('businessProfile.fields.addressLine2')} error={!!errors.address_line2} helperText={errors.address_line2?.message} disabled={!canEdit || updateBusiness.isPending} />
                    )} />
                  </Box>
                  <Box
                    sx={{
                      pointerEvents: !canEdit || updateBusiness.isPending ? 'none' : 'auto',
                      opacity: !canEdit || updateBusiness.isPending ? 0.7 : 1,
                    }}
                  >
                    <CambodiaAddressFields
                      control={control}
                      errors={errors}
                      setValue={setValue}
                      labels={{
                        country: t('businessProfile.fields.addressCountry'),
                        province_city: t('businessProfile.fields.provinceCity'),
                        district: t('businessProfile.fields.district'),
                        commune: t('businessProfile.fields.commune'),
                        village: t('businessProfile.fields.village'),
                      }}
                    />
                  </Box>
                </Box>

                {canEdit && (
                  <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={updateBusiness.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
                      disabled={updateBusiness.isPending}
                    >
                      {t('businessProfile.save')}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
