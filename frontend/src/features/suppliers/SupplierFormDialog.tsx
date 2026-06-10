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
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { CambodiaAddressFields } from '@/components/ui/CambodiaAddressFields'
import { supplierSchema, type SupplierFormInput, type SupplierFormValues } from './schema'
import type { CustomFieldDefinition } from '@/types/customField'
import type { Supplier, SupplierPayload } from '@/types/supplier'

interface SupplierFormDialogProps {
  open: boolean
  supplier: Supplier | null
  customFields: CustomFieldDefinition[]
  isLoadingCustomFields: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: SupplierPayload) => Promise<void>
}

const defaultValues: SupplierFormInput = {
  name: '',
  company: '',
  email: '',
  phone: '',
  mobile: '',
  tax_id: '',
  village: '',
  commune: '',
  district: '',
  province_city: '',
  country: 'Cambodia',
  pay_term: 0,
  opening_balance: 0,
  status: 'active',
  notes: '',
  documents_text: '',
  custom_fields: {},
}

function addressValue(address: Record<string, unknown> | null, keys: string[]) {
  if (!address) return ''

  for (const key of keys) {
    const value = address[key]
    if (typeof value === 'string') return value
  }

  return ''
}

function parseDocuments(value: string) {
  return value
    .split(/\r?\n/)
    .map((document) => document.trim())
    .filter(Boolean)
}

function buildAddress(values: SupplierFormValues) {
  const address = {
    village: values.village,
    commune: values.commune,
    district: values.district,
    province_city: values.province_city,
    country: values.country,
  }

  return Object.values(address).some((value) => value !== null && value !== '') ? address : null
}

function buildSupplierPayload(
  values: SupplierFormValues,
  customFields: Record<string, unknown>
): SupplierPayload {
  return {
    name: values.name,
    company: values.company,
    email: values.email,
    phone: values.phone,
    mobile: values.mobile,
    tax_id: values.tax_id,
    address: buildAddress(values),
    pay_term: values.pay_term,
    opening_balance: values.opening_balance,
    status: values.status,
    notes: values.notes,
    documents: parseDocuments(values.documents_text),
    custom_fields: customFields,
  }
}

function normalizeCustomFields(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== 'object') return {}

  return value as Record<string, unknown>
}

function supplierToFormValues(supplier: Supplier | null): SupplierFormInput {
  if (!supplier) return defaultValues

  return {
    name: supplier.name,
    company: supplier.company ?? '',
    email: supplier.email ?? '',
    phone: supplier.phone ?? '',
    mobile: supplier.mobile ?? '',
    tax_id: supplier.tax_id ?? '',
    village: addressValue(supplier.address, ['village', 'line_1', 'address_line_1', 'street', 'address']),
    commune: addressValue(supplier.address, ['commune', 'line_2', 'address_line_2']),
    district: addressValue(supplier.address, ['district']),
    province_city: addressValue(supplier.address, ['province_city', 'province', 'city', 'state']),
    country: addressValue(supplier.address, ['country']) || 'Cambodia',
    pay_term: supplier.pay_term,
    opening_balance: supplier.opening_balance,
    status: supplier.status,
    notes: supplier.notes ?? '',
    documents_text: supplier.documents?.join('\n') ?? '',
    custom_fields: normalizeCustomFields(supplier.custom_fields),
  }
}

function isEmptyCustomValue(value: unknown) {
  return value === undefined || value === null || value === ''
}

function isMissingRequiredCustomValue(definition: CustomFieldDefinition, value: unknown) {
  if (definition.field_type === 'checkbox') {
    return value !== true
  }

  return isEmptyCustomValue(value)
}

function normalizeCustomFieldValue(definition: CustomFieldDefinition, value: unknown) {
  if (definition.field_type === 'checkbox') return Boolean(value)
  if (definition.field_type === 'number') {
    if (value === '' || value === null || value === undefined) return null
    const numberValue = Number(value)
    return Number.isNaN(numberValue) ? null : numberValue
  }

  return value === '' || value === undefined ? null : value
}

export function SupplierFormDialog({
  open,
  supplier,
  customFields,
  isLoadingCustomFields,
  isSaving,
  onClose,
  onSubmit,
}: SupplierFormDialogProps) {
  const { t } = useTranslation(['suppliers', 'common'])
  const [serverError, setServerError] = useState('')
  const title = supplier ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => supplierToFormValues(supplier), [supplier])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setFocus,
    setValue,
    formState: { errors },
  } = useForm<SupplierFormInput, unknown, SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const getInvalidFieldLabels = (formErrors: FieldErrors<SupplierFormInput>) => {
    const fieldLabels: Partial<Record<keyof SupplierFormInput, string>> = {
      name: t('fields.name'),
      company: t('fields.company'),
      email: t('fields.email'),
      phone: t('fields.phone'),
      mobile: t('fields.mobile'),
      tax_id: t('fields.taxId'),
      village: t('fields.village'),
      commune: t('fields.commune'),
      district: t('fields.district'),
      province_city: t('fields.province_city'),
      country: t('fields.country'),
      pay_term: t('fields.payTerm'),
      opening_balance: t('fields.openingBalance'),
      status: t('fields.status'),
      notes: t('fields.notes'),
      documents_text: t('fields.documents'),
    }

    const labels = Object.entries(fieldLabels)
      .filter(([field]) => Boolean(formErrors[field as keyof SupplierFormInput]))
      .map(([, label]) => label)

    const customFieldErrors = formErrors.custom_fields as
      | (Record<string, { message?: string }> & { message?: string })
      | undefined

    if (customFieldErrors?.message) {
      labels.push(t('customFields.title'))
    }

    customFields.forEach((definition) => {
      if (customFieldErrors?.[definition.field_name]) {
        labels.push(definition.field_label)
      }
    })

    return labels
  }

  const setValidationSummary = (fieldLabels: string[]) => {
    setServerError(
      fieldLabels.length > 0
        ? t('validation.fixFormErrorsWithFields', { fields: fieldLabels.join(', ') })
        : t('validation.fixFormErrors')
    )
  }

  const submitForm = async (formValues: SupplierFormValues) => {
    setServerError('')

    const customFieldValues: Record<string, unknown> = {}
    let hasCustomFieldErrors = false
    const missingCustomFieldLabels: string[] = []

    customFields.forEach((definition) => {
      const value = formValues.custom_fields?.[definition.field_name]
      if (definition.is_required && isMissingRequiredCustomValue(definition, value)) {
        setError(`custom_fields.${definition.field_name}` as keyof SupplierFormInput, {
          type: 'manual',
          message: t('validation.requiredCustomField', { field: definition.field_label }),
        })
        hasCustomFieldErrors = true
        missingCustomFieldLabels.push(definition.field_label)
      }

      customFieldValues[definition.field_name] = normalizeCustomFieldValue(definition, value)
    })

    if (hasCustomFieldErrors) {
      setValidationSummary(missingCustomFieldLabels)
      return
    }

    try {
      await onSubmit(buildSupplierPayload(formValues, customFieldValues))
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof SupplierFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  const handleInvalidSubmit = (formErrors: FieldErrors<SupplierFormInput>) => {
    setValidationSummary(getInvalidFieldLabels(formErrors))

    const focusOrder: Array<keyof SupplierFormInput> = [
      'name',
      'company',
      'email',
      'phone',
      'mobile',
      'tax_id',
      'pay_term',
      'opening_balance',
      'status',
      'village',
      'commune',
      'district',
      'province_city',
      'country',
      'notes',
      'documents_text',
    ]
    const firstInvalidField = focusOrder.find((field) => Boolean(formErrors[field]))

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
                name="company"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.company')}
                    error={!!errors.company}
                    helperText={errors.company?.message}
                  />
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
                    <InputLabel id="supplier-status-label">{t('fields.status')}</InputLabel>
                    <Select {...field} MenuProps={{ disableScrollLock: true }} labelId="supplier-status-label" label={t('fields.status')}>
                      <MenuItem value="active">{t('common:status.active')}</MenuItem>
                      <MenuItem value="inactive">{t('common:status.inactive')}</MenuItem>
                    </Select>
                    <FormHelperText>{errors.status?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Box>

            <CambodiaAddressFields
              control={control}
              errors={errors}
              setValue={setValue}
              labels={{
                country: t('fields.country'),
                province_city: t('fields.province_city'),
                district: t('fields.district'),
                commune: t('fields.commune'),
                village: t('fields.village'),
              }}
            />

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

            <Controller
              name="documents_text"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('fields.documents')}
                  placeholder={t('placeholders.documents')}
                  multiline
                  minRows={3}
                  error={!!errors.documents_text}
                  helperText={errors.documents_text?.message || t('help.documents')}
                />
              )}
            />

            {isLoadingCustomFields && (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <CircularProgress size={18} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('customFields.loading')}
                </Typography>
              </Stack>
            )}

            {!isLoadingCustomFields && customFields.length > 0 && (
              <Stack spacing={2}>
                <Typography variant="subtitle2">{t('customFields.title')}</Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                    gap: 2,
                  }}
                >
                  {customFields.map((definition) => {
                    const name = `custom_fields.${definition.field_name}` as keyof SupplierFormInput
                    const customFieldErrors = errors.custom_fields as Record<string, { message?: string }> | undefined
                    const errorMessage = customFieldErrors?.[definition.field_name]?.message

                    if (definition.field_type === 'checkbox') {
                      return (
                        <Controller
                          key={definition.id}
                          name={name}
                          control={control}
                          render={({ field }) => (
                            <FormControl error={!!errorMessage}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={Boolean(field.value)}
                                    onChange={(_, checked) => field.onChange(checked)}
                                  />
                                }
                                label={definition.field_label}
                              />
                              <FormHelperText>{errorMessage}</FormHelperText>
                            </FormControl>
                          )}
                        />
                      )
                    }

                    if (definition.field_type === 'select') {
                      return (
                        <Controller
                          key={definition.id}
                          name={name}
                          control={control}
                          render={({ field }) => (
                            <FormControl error={!!errorMessage} required={definition.is_required}>
                              <InputLabel id={`supplier-custom-field-${definition.id}`}>
                                {definition.field_label}
                              </InputLabel>
                              <Select
                                {...field}
                                MenuProps={{ disableScrollLock: true }}
                                value={typeof field.value === 'string' ? field.value : ''}
                                labelId={`supplier-custom-field-${definition.id}`}
                                label={definition.field_label}
                              >
                                {!definition.is_required && (
                                  <MenuItem value="">{t('customFields.noSelection')}</MenuItem>
                                )}
                                {(definition.options ?? []).map((option) => (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                ))}
                              </Select>
                              <FormHelperText>{errorMessage}</FormHelperText>
                            </FormControl>
                          )}
                        />
                      )
                    }

                    return (
                      <Controller
                        key={definition.id}
                        name={name}
                        control={control}
                        render={({ field }) => {
                          if (definition.field_type === 'date') {
                            return (
                              <AppDatePicker
                                value={typeof field.value === 'string' ? field.value : ''}
                                onChange={field.onChange}
                                label={definition.field_label}
                                required={definition.is_required}
                                error={!!errorMessage}
                                helperText={errorMessage}
                              />
                            )
                          }

                          return (
                            <TextField
                              {...field}
                              value={
                                typeof field.value === 'string' || typeof field.value === 'number'
                                  ? field.value
                                  : ''
                              }
                              label={definition.field_label}
                              type={definition.field_type === 'number' ? 'number' : 'text'}
                              required={definition.is_required}
                              error={!!errorMessage}
                              helperText={errorMessage}
                            />
                          )
                        }}
                      />
                    )
                  })}
                </Box>
              </Stack>
            )}
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
