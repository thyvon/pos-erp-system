'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, type FieldErrors, type SubmitErrorHandler } from 'react-hook-form'
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
import { customerSchema, type CustomerFormInput, type CustomerFormValues } from './schema'
import type { CustomFieldDefinition } from '@/types/customField'
import type { Customer, CustomerPayload } from '@/types/customer'
import type { CustomerGroup } from '@/types/customerGroup'

interface CustomerFormDialogProps {
  open: boolean
  customer: Customer | null
  customerGroups: CustomerGroup[]
  isLoadingCustomerGroups: boolean
  customFields: CustomFieldDefinition[]
  isLoadingCustomFields: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: CustomerPayload) => Promise<void>
}

const defaultValues: CustomerFormInput = {
  customer_group_id: '',
  name: '',
  type: 'individual',
  email: '',
  phone: '',
  mobile: '',
  tax_id: '',
  date_of_birth: '',
  village: '',
  commune: '',
  district: '',
  province_city: '',
  country: 'Cambodia',
  credit_limit: 0,
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

function buildAddress(values: CustomerFormValues) {
  const address = {
    village: values.village,
    commune: values.commune,
    district: values.district,
    province_city: values.province_city,
    country: values.country,
  }

  const hasAddressValue = Object.values(address).some((value) => value !== null && value !== '')

  return hasAddressValue ? address : null
}

function customerToFormValues(customer: Customer | null): CustomerFormInput {
  if (!customer) return defaultValues
  const customFields =
    customer.custom_fields && !Array.isArray(customer.custom_fields) ? customer.custom_fields : {}

  return {
    customer_group_id: customer.customer_group_id ?? '',
    name: customer.name,
    type: customer.type,
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    mobile: customer.mobile ?? '',
    tax_id: customer.tax_id ?? '',
    date_of_birth: customer.date_of_birth ?? '',
    village: addressValue(customer.address, ['village', 'line_1', 'address_line_1', 'street', 'address']),
    commune: addressValue(customer.address, ['commune', 'line_2', 'address_line_2']),
    district: addressValue(customer.address, ['district']),
    province_city: addressValue(customer.address, ['province_city', 'province', 'city', 'state']),
    country: addressValue(customer.address, ['country']) || 'Cambodia',
    credit_limit: customer.credit_limit,
    pay_term: customer.pay_term,
    opening_balance: customer.opening_balance,
    status: customer.status,
    notes: customer.notes ?? '',
    documents_text: customer.documents?.join('\n') ?? '',
    custom_fields: customFields,
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
  if (definition.field_type === 'checkbox') {
    return Boolean(value)
  }

  if (definition.field_type === 'number') {
    if (value === '' || value === null || value === undefined) return null
    const numberValue = Number(value)
    return Number.isNaN(numberValue) ? null : numberValue
  }

  return value === '' || value === undefined ? null : value
}

function getFirstErrorPath(errors: FieldErrors<CustomerFormInput>, prefix = ''): { path: string; message?: string } | null {
  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue

    const path = prefix ? `${prefix}.${key}` : key

    if ('message' in value && typeof value.message === 'string') {
      return { path, message: value.message }
    }

    if (typeof value === 'object') {
      const nested = getFirstErrorPath(value as FieldErrors<CustomerFormInput>, path)
      if (nested) return nested
    }
  }

  return null
}

export function CustomerFormDialog({
  open,
  customer,
  customerGroups,
  isLoadingCustomerGroups,
  customFields,
  isLoadingCustomFields,
  isSaving,
  onClose,
  onSubmit,
}: CustomerFormDialogProps) {
  const { t } = useTranslation(['customers', 'common'])
  const [serverError, setServerError] = useState('')
  const [clientError, setClientError] = useState('')
  const title = customer ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => customerToFormValues(customer), [customer])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormInput, unknown, CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  })

  const getFieldLabel = (path: string) => {
    if (path.startsWith('custom_fields.')) {
      const fieldName = path.replace('custom_fields.', '')
      return customFields.find((definition) => definition.field_name === fieldName)?.field_label ?? fieldName
    }

    const fieldLabels: Record<string, string> = {
      customer_group_id: t('fields.customerGroup'),
      name: t('fields.name'),
      type: t('fields.type'),
      email: t('fields.email'),
      phone: t('fields.phone'),
      mobile: t('fields.mobile'),
      tax_id: t('fields.taxId'),
      date_of_birth: t('fields.dateOfBirth'),
      village: t('fields.village'),
      commune: t('fields.commune'),
      district: t('fields.district'),
      province_city: t('fields.provinceCity'),
      country: t('fields.country'),
      credit_limit: t('fields.creditLimit'),
      pay_term: t('fields.payTerm'),
      opening_balance: t('fields.openingBalance'),
      status: t('fields.status'),
      notes: t('fields.notes'),
      documents_text: t('fields.documents'),
    }

    return fieldLabels[path] ?? path
  }

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const submitForm = async (formValues: CustomerFormValues) => {
    setServerError('')
    setClientError('')

    const customFieldValues: Record<string, unknown> = {}
    const firstMissingCustomField =
      customFields.find((definition) => {
        const value = formValues.custom_fields?.[definition.field_name]
        return definition.is_required && isMissingRequiredCustomValue(definition, value)
      }) ?? null

    customFields.forEach((definition) => {
      const value = formValues.custom_fields?.[definition.field_name]
      if (definition.is_required && isMissingRequiredCustomValue(definition, value)) {
        setError(`custom_fields.${definition.field_name}` as keyof CustomerFormInput, {
          type: 'manual',
          message: t('validation.requiredCustomField', { field: definition.field_label }),
        })
      }

      customFieldValues[definition.field_name] = normalizeCustomFieldValue(definition, value)
    })

    if (firstMissingCustomField) {
      setClientError(
        t('validation.fixField', {
          field: firstMissingCustomField.field_label,
          message: t('validation.requiredCustomField', { field: firstMissingCustomField.field_label }),
        })
      )
      return
    }

    try {
      await onSubmit({
        ...formValues,
        address: buildAddress(formValues),
        documents: parseDocuments(formValues.documents_text),
        custom_fields: customFieldValues,
      })
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

  const handleInvalidSubmit: SubmitErrorHandler<CustomerFormInput> = (invalidErrors) => {
    const firstError = getFirstErrorPath(invalidErrors)

    if (!firstError) {
      setClientError(t('validation.fixForm'))
      return
    }

    setClientError(
      t('validation.fixField', {
        field: getFieldLabel(firstError.path),
        message: firstError.message ?? t('validation.invalidValue'),
      })
    )
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="md">
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm, handleInvalidSubmit)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {clientError && <Alert severity="warning">{clientError}</Alert>}
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
                    <Select {...field} MenuProps={{ disableScrollLock: true }} labelId="customer-type-label" label={t('fields.type')}>
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
                name="customer_group_id"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.customer_group_id}>
                    <InputLabel id="customer-group-label">{t('fields.customerGroup')}</InputLabel>
                    <Select
                      {...field}
                      MenuProps={{ disableScrollLock: true }}
                      value={field.value ?? ''}
                      labelId="customer-group-label"
                      label={t('fields.customerGroup')}
                      disabled={isLoadingCustomerGroups}
                    >
                      <MenuItem value="">{t('placeholders.noCustomerGroup')}</MenuItem>
                      {customerGroups.map((group) => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.customer_group_id?.message}</FormHelperText>
                  </FormControl>
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
                name="date_of_birth"
                control={control}
                render={({ field }) => (
                  <AppDatePicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    label={t('fields.dateOfBirth')}
                    disableFuture
                    error={!!errors.date_of_birth}
                    helperText={errors.date_of_birth?.message}
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
                    <Select {...field} MenuProps={{ disableScrollLock: true }} labelId="customer-status-label" label={t('fields.status')}>
                      <MenuItem value="active">{t('common:status.active')}</MenuItem>
                      <MenuItem value="inactive">{t('common:status.inactive')}</MenuItem>
                    </Select>
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
                province_city: t('fields.provinceCity'),
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
                    const name = `custom_fields.${definition.field_name}` as keyof CustomerFormInput
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
                              <InputLabel id={`customer-custom-field-${definition.id}`}>
                                {definition.field_label}
                              </InputLabel>
                              <Select
                                {...field}
                                MenuProps={{ disableScrollLock: true }}
                                value={typeof field.value === 'string' ? field.value : ''}
                                labelId={`customer-custom-field-${definition.id}`}
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
