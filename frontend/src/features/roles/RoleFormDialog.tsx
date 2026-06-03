'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { roleSchema, type RoleFormValues } from './schema'
import type { RoleListItem, RoleOptions, RolePayload } from '@/types/role'

interface RoleFormDialogProps {
  open: boolean
  role: RoleListItem | null
  options: RoleOptions | undefined
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: RolePayload) => Promise<void>
}

const defaultValues: RoleFormValues = {
  name: '',
  permissions: [],
}

function roleToFormValues(role: RoleListItem | null): RoleFormValues {
  if (!role) return defaultValues

  return {
    name: role.name,
    permissions: role.permissions ?? [],
  }
}

function formatPermission(permission: string) {
  return permission.replaceAll('.', ' / ').replaceAll('_', ' ')
}

export function RoleFormDialog({
  open,
  role,
  options,
  isSaving,
  onClose,
  onSubmit,
}: RoleFormDialogProps) {
  const { t } = useTranslation(['roles', 'common'])
  const [serverError, setServerError] = useState('')
  const values = useMemo(() => roleToFormValues(role), [role])
  const permissionGroups = options?.permissions ?? []
  const protectedRole = role?.is_protected ?? false
  const title = role ? t('form.editTitle') : t('form.createTitle')

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues,
  })
  const selectedPermissions = useWatch({ control, name: 'permissions' })

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const toggleGroup = (permissions: string[], checked: boolean) => {
    const current = new Set(selectedPermissions)

    permissions.forEach((permission) => {
      if (checked) {
        current.add(permission)
        return
      }

      current.delete(permission)
    })

    setValue('permissions', Array.from(current).sort(), { shouldDirty: true, shouldValidate: true })
  }

  const submitForm = async (formValues: RoleFormValues) => {
    setServerError('')

    try {
      await onSubmit({
        name: formValues.name.trim(),
        permissions: formValues.permissions,
      })
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)

      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof RoleFormValues, {
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
            {protectedRole && (
              <Alert severity="info">
                {t('form.protectedHelp')}
              </Alert>
            )}

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('fields.name')}
                  error={!!errors.name}
                  helperText={errors.name?.message || (protectedRole ? t('form.protectedNameHelp') : undefined)}
                  disabled={protectedRole}
                  required
                />
              )}
            />

            <Stack spacing={1}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
              >
                <Box>
                  <Typography variant="subtitle2">{t('fields.permissions')}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('form.permissionsHelp')}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={t('summary.permissionsSelected', { count: selectedPermissions.length })}
                />
              </Stack>

              {permissionGroups.map((group) => {
                const groupSelectedCount = group.permissions.filter((permission) =>
                  selectedPermissions.includes(permission)
                ).length
                const allChecked = group.permissions.length > 0 && groupSelectedCount === group.permissions.length
                const partiallyChecked = groupSelectedCount > 0 && !allChecked

                return (
                  <Box
                    key={group.group}
                    sx={{
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      p: 1.5,
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 1 }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allChecked}
                            indeterminate={partiallyChecked}
                            onChange={(event) => toggleGroup(group.permissions, event.target.checked)}
                          />
                        }
                        label={
                          <Typography variant="subtitle2">
                            {t(`groups.${group.group}`, { defaultValue: group.group })}
                          </Typography>
                        }
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('summary.groupSelected', {
                          selected: groupSelectedCount,
                          total: group.permissions.length,
                        })}
                      </Typography>
                    </Stack>

                    <Controller
                      name="permissions"
                      control={control}
                      render={({ field }) => (
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                            gap: 0.5,
                          }}
                        >
                          {group.permissions.map((permission) => (
                            <FormControlLabel
                              key={permission}
                              control={
                                <Checkbox
                                  checked={(field.value ?? []).includes(permission)}
                                  onChange={(event) => {
                                    const next = new Set(field.value ?? [])

                                    if (event.target.checked) {
                                      next.add(permission)
                                    } else {
                                      next.delete(permission)
                                    }

                                    field.onChange(Array.from(next).sort())
                                  }}
                                />
                              }
                              label={
                                <Typography variant="body2">
                                  {formatPermission(permission)}
                                </Typography>
                              }
                            />
                          ))}
                        </Box>
                      )}
                    />
                  </Box>
                )
              })}
            </Stack>
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
