'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { userSchema, type UserFormInput, type UserFormValues } from './schema'
import type { UserAccessOptions, UserListItem, UserPayload } from '@/types/user'

interface UserFormDialogProps {
  open: boolean
  user: UserListItem | null
  options: UserAccessOptions | undefined
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: UserPayload) => Promise<void>
}

const defaultValues: UserFormInput = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  avatar_url: '',
  status: 'active',
  max_discount: '',
  commission_percentage: '',
  sales_target_amount: '',
  preference_locale: 'en',
  preference_timezone: 'UTC',
  roles: [],
  direct_permissions: [],
  branch_ids: [],
  default_branch_id: '',
}

function valueToText(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value)
}

function userToFormValues(user: UserListItem | null): UserFormInput {
  if (!user) return defaultValues
  const preferences = user.preferences ?? {}

  return {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    password: '',
    phone: user.phone ?? '',
    avatar_url: user.avatar_url ?? '',
    status: user.status,
    max_discount: valueToText(user.max_discount),
    commission_percentage: valueToText(user.commission_percentage),
    sales_target_amount: valueToText(user.sales_target_amount),
    preference_locale: preferences.locale === 'km' ? 'km' : 'en',
    preference_timezone: typeof preferences.timezone === 'string' ? preferences.timezone : 'UTC',
    roles: user.roles ?? [],
    direct_permissions: user.direct_permissions ?? [],
    branch_ids: user.branch_ids ?? [],
    default_branch_id: user.default_branch_id ?? '',
  }
}

export function UserFormDialog({
  open,
  user,
  options,
  isSaving,
  onClose,
  onSubmit,
}: UserFormDialogProps) {
  const { t } = useTranslation(['users', 'common'])
  const [serverError, setServerError] = useState('')
  const title = user ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => userToFormValues(user), [user])
  const roleOptions = options?.roles ?? []
  const branchOptions = options?.branches ?? []
  const permissionOptions = useMemo(
    () => (options?.permissions ?? []).flatMap((group) =>
      group.permissions.map((permission) => ({
        group: group.group,
        permission,
      }))
    ),
    [options?.permissions]
  )

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserFormInput, unknown, UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues,
  })
  const branchIds = useWatch({ control, name: 'branch_ids' })
  const directPermissions = useWatch({ control, name: 'direct_permissions' })

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const submitForm = async (formValues: UserFormValues) => {
    setServerError('')

    if (!user && formValues.password.length < 8) {
      setError('password', { type: 'manual', message: t('validation.passwordRequired') })
      return
    }

    const payload: UserPayload = {
      ...formValues,
      password: formValues.password || null,
      preferences: {
        locale: formValues.preference_locale,
        timezone: formValues.preference_timezone,
      },
      roles: formValues.roles,
      branch_ids: formValues.branch_ids,
      default_branch_id: formValues.default_branch_id,
    }

    try {
      await onSubmit(payload)
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof UserFormInput, {
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
                name="first_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('fields.firstName')}
                    error={!!errors.first_name}
                    helperText={errors.first_name?.message}
                    required
                  />
                )}
              />
              <Controller
                name="last_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('fields.lastName')}
                    error={!!errors.last_name}
                    helperText={errors.last_name?.message}
                    required
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
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    required
                  />
                )}
              />
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('fields.password')}
                    type="password"
                    error={!!errors.password}
                    helperText={errors.password?.message || (user ? t('help.passwordEdit') : t('help.passwordCreate'))}
                    required={!user}
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
                name="avatar_url"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.avatarUrl')}
                    error={!!errors.avatar_url}
                    helperText={errors.avatar_url?.message}
                  />
                )}
              />
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.status}>
                    <InputLabel id="user-status-label">{t('fields.status')}</InputLabel>
                    <Select {...field} labelId="user-status-label" label={t('fields.status')}>
                      <MenuItem value="active">{t('status.active')}</MenuItem>
                      <MenuItem value="inactive">{t('status.inactive')}</MenuItem>
                      <MenuItem value="suspended">{t('status.suspended')}</MenuItem>
                    </Select>
                    <FormHelperText>{errors.status?.message}</FormHelperText>
                  </FormControl>
                )}
              />
              <Controller
                name="roles"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={roleOptions.map((roleOption) => roleOption.name)}
                    value={field.value ?? []}
                    onChange={(_, value) => field.onChange(value)}
                    filterSelectedOptions
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('fields.roles')}
                        error={!!errors.roles}
                        helperText={errors.roles?.message}
                      />
                    )}
                  />
                )}
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Controller
                name="max_discount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.maxDiscount')}
                    type="number"
                    error={!!errors.max_discount}
                    helperText={errors.max_discount?.message}
                  />
                )}
              />
              <Controller
                name="commission_percentage"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.commissionPercentage')}
                    type="number"
                    error={!!errors.commission_percentage}
                    helperText={errors.commission_percentage?.message}
                  />
                )}
              />
              <Controller
                name="sales_target_amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.salesTargetAmount')}
                    type="number"
                    error={!!errors.sales_target_amount}
                    helperText={errors.sales_target_amount?.message}
                  />
                )}
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Controller
                name="branch_ids"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.branch_ids}>
                    <InputLabel id="user-branches-label">{t('fields.branches')}</InputLabel>
                    <Select
                      {...field}
                      multiple
                      value={field.value ?? []}
                      labelId="user-branches-label"
                      label={t('fields.branches')}
                      input={<OutlinedInput label={t('fields.branches')} />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((branchId) => {
                            const branch = branchOptions.find((item) => item.id === branchId)
                            return <Chip key={branchId} size="small" label={branch?.name ?? branchId} />
                          })}
                        </Box>
                      )}
                    >
                      {branchOptions.map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                          <Checkbox checked={(field.value ?? []).includes(branch.id)} />
                          <ListItemText primary={branch.name} secondary={branch.code} />
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.branch_ids?.message}</FormHelperText>
                  </FormControl>
                )}
              />
              <Controller
                name="default_branch_id"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.default_branch_id}>
                    <InputLabel id="user-default-branch-label">{t('fields.defaultBranch')}</InputLabel>
                    <Select
                      {...field}
                      value={field.value ?? ''}
                      labelId="user-default-branch-label"
                      label={t('fields.defaultBranch')}
                    >
                      <MenuItem value="">{t('placeholders.noDefaultBranch')}</MenuItem>
                      {branchOptions
                        .filter((branch) => branchIds.includes(branch.id))
                        .map((branch) => (
                          <MenuItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>{errors.default_branch_id?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Box>

            <Controller
              name="direct_permissions"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={permissionOptions}
                  value={permissionOptions.filter((option) => (field.value ?? []).includes(option.permission))}
                  onChange={(_, value) => field.onChange(value.map((option) => option.permission))}
                  groupBy={(option) => option.group}
                  getOptionLabel={(option) => option.permission}
                  isOptionEqualToValue={(option, value) => option.permission === value.permission}
                  filterSelectedOptions
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('fields.directPermissions')}
                      error={!!errors.direct_permissions}
                      helperText={errors.direct_permissions?.message}
                    />
                  )}
                  renderValue={(value, getItemProps) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {value.map((option, index) => {
                        const { key, ...itemProps } = getItemProps({ index })

                        return (
                          <Chip
                            key={key}
                            size="small"
                            label={option.permission}
                            {...itemProps}
                          />
                        )
                      })}
                    </Box>
                  )}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props

                    return (
                      <li key={key} {...optionProps}>
                        <ListItemText primary={option.permission} />
                      </li>
                    )
                  }}
                />
              )}
            />

            <Typography variant="caption" sx={{ mt: -2, color: 'text.secondary' }}>
              {t('summary.permissionsSelected', { count: directPermissions.length })}
            </Typography>

            <Controller
              name="preference_locale"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.preference_locale}>
                  <InputLabel id="user-preference-locale-label">{t('fields.preferenceLocale')}</InputLabel>
                  <Select
                    {...field}
                    labelId="user-preference-locale-label"
                    label={t('fields.preferenceLocale')}
                  >
                    <MenuItem value="en">{t('preferences.language.en')}</MenuItem>
                    <MenuItem value="km">{t('preferences.language.km')}</MenuItem>
                  </Select>
                  <FormHelperText>{errors.preference_locale?.message}</FormHelperText>
                </FormControl>
              )}
            />

            <Controller
              name="preference_timezone"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.preference_timezone}>
                  <InputLabel id="user-preference-timezone-label">{t('fields.preferenceTimezone')}</InputLabel>
                  <Select
                    {...field}
                    labelId="user-preference-timezone-label"
                    label={t('fields.preferenceTimezone')}
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="Asia/Phnom_Penh">Asia/Phnom Penh</MenuItem>
                    <MenuItem value="Asia/Bangkok">Asia/Bangkok</MenuItem>
                    <MenuItem value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh</MenuItem>
                    <MenuItem value="Asia/Singapore">Asia/Singapore</MenuItem>
                  </Select>
                  <FormHelperText>{errors.preference_timezone?.message}</FormHelperText>
                </FormControl>
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
