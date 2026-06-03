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
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { useUsersQuery } from '@/features/users/hooks'
import { branchSchema, type BranchFormInput, type BranchFormValues } from './schema'
import type { Branch, BranchPayload } from '@/types/branch'

interface BranchFormDialogProps {
  open: boolean
  branch: Branch | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: BranchPayload) => Promise<void>
}

const defaultValues: BranchFormInput = {
  name: '',
  code: '',
  type: 'retail',
  phone: '',
  email: '',
  manager_id: '',
  address: {
    line1: '',
    city: '',
  },
  is_default: false,
  is_active: true,
  business_hours: '',
  invoice_settings: '',
}

function jsonToFormValue(value: Record<string, unknown> | null): string {
  return value ? JSON.stringify(value, null, 2) : ''
}

function branchToFormValues(branch: Branch | null): BranchFormInput {
  if (!branch) return defaultValues

  return {
    name: branch.name,
    code: branch.code ?? '',
    type: branch.type,
    phone: branch.phone ?? '',
    email: branch.email ?? '',
    manager_id: branch.manager?.id ?? '',
    address: {
      line1: branch.address?.line1 ?? '',
      city: branch.address?.city ?? '',
    },
    is_default: branch.is_default,
    is_active: branch.is_active,
    business_hours: jsonToFormValue(branch.business_hours),
    invoice_settings: jsonToFormValue(branch.invoice_settings),
  }
}

export function BranchFormDialog({
  open,
  branch,
  isSaving,
  onClose,
  onSubmit,
}: BranchFormDialogProps) {
  const { t } = useTranslation(['branches', 'common'])
  const [serverError, setServerError] = useState('')
  const title = branch ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => branchToFormValues(branch), [branch])
  const managersQuery = useUsersQuery(
    { status: 'active', per_page: 100 },
    open
  )
  const managerOptions = useMemo(() => {
    const options = managersQuery.data?.data ?? []
    if (!branch?.manager || options.some((manager) => manager.id === branch.manager?.id)) {
      return options
    }

    return [
      {
        id: branch.manager.id,
        business_id: branch.business_id,
        default_branch_id: null,
        first_name: branch.manager.first_name,
        last_name: branch.manager.last_name,
        full_name: `${branch.manager.first_name} ${branch.manager.last_name}`.trim(),
        email: branch.manager.email,
        phone: null,
        status: 'active' as const,
        roles: [],
        branch_ids: [],
        created_at: '',
        updated_at: '',
      },
      ...options,
    ]
  }, [branch, managersQuery.data?.data])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BranchFormInput, unknown, BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const submitForm = async (formValues: BranchFormValues) => {
    setServerError('')

    try {
      await onSubmit(formValues)
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof BranchFormInput, {
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
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.code')}
                    error={!!errors.code}
                    helperText={errors.code?.message || t('help.code')}
                  />
                )}
              />

              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.type}>
                    <InputLabel id="branch-type-label">{t('fields.type')}</InputLabel>
                    <Select {...field} labelId="branch-type-label" label={t('fields.type')}>
                      <MenuItem value="retail">{t('type.retail')}</MenuItem>
                      <MenuItem value="warehouse">{t('type.warehouse')}</MenuItem>
                      <MenuItem value="office">{t('type.office')}</MenuItem>
                      <MenuItem value="online">{t('type.online')}</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="manager_id"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.manager_id}>
                    <InputLabel id="branch-manager-label">{t('fields.manager')}</InputLabel>
                    <Select
                      {...field}
                      value={field.value ?? ''}
                      labelId="branch-manager-label"
                      label={t('fields.manager')}
                    >
                      <MenuItem value="">{t('placeholders.noManager')}</MenuItem>
                      {managerOptions.map((manager) => (
                        <MenuItem key={manager.id} value={manager.id}>
                          {manager.full_name || manager.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                name="address.city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.city')}
                    error={!!errors.address?.city}
                    helperText={errors.address?.city?.message}
                  />
                )}
              />
            </Box>

            <Controller
              name="address.line1"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('fields.addressLine1')}
                  multiline
                  minRows={2}
                  error={!!errors.address?.line1}
                  helperText={errors.address?.line1?.message}
                />
              )}
            />

            <Stack spacing={1}>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                    label={t('fields.active')}
                  />
                )}
              />
              <Controller
                name="is_default"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                    label={t('fields.default')}
                  />
                )}
              />
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Controller
                name="business_hours"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.businessHours')}
                    multiline
                    minRows={4}
                    error={!!errors.business_hours}
                    helperText={errors.business_hours?.message || t('help.businessHours')}
                  />
                )}
              />

              <Controller
                name="invoice_settings"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.invoiceSettings')}
                    multiline
                    minRows={4}
                    error={!!errors.invoice_settings}
                    helperText={errors.invoice_settings?.message || t('help.invoiceSettings')}
                  />
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
