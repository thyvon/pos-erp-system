'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
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
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { chartOfAccountSchema, type ChartOfAccountFormInput, type ChartOfAccountFormValues } from './schema'
import type { AccountNormalBalance, AccountType, ChartOfAccount, ChartOfAccountPayload } from '@/types/accounting'

interface ChartOfAccountFormDialogProps {
  open: boolean
  account: ChartOfAccount | null
  parentOptions: ChartOfAccount[]
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: ChartOfAccountPayload) => Promise<void>
}

const accountTypes: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense']
const normalBalances: AccountNormalBalance[] = ['debit', 'credit']

const defaultValues: ChartOfAccountFormInput = {
  parent_id: null,
  code: '',
  name: '',
  type: 'asset',
  sub_type: '',
  normal_balance: 'debit',
  is_active: true,
  description: '',
}

function accountToFormValues(account: ChartOfAccount | null): ChartOfAccountFormInput {
  if (!account) return defaultValues

  return {
    parent_id: account.parent_id,
    code: account.code,
    name: account.name,
    type: account.type,
    sub_type: account.detail_type ?? '',
    normal_balance: account.normal_balance,
    is_active: account.is_active,
    description: account.description ?? '',
  }
}

export function ChartOfAccountFormDialog({
  open,
  account,
  parentOptions,
  isSaving,
  onClose,
  onSubmit,
}: ChartOfAccountFormDialogProps) {
  const { t } = useTranslation(['accounting', 'common'])
  const [serverError, setServerError] = useState('')
  const title = account ? t('coa.form.editTitle') : t('coa.form.createTitle')
  const values = useMemo(() => accountToFormValues(account), [account])
  const availableParents = parentOptions.filter((option) => option.id !== account?.id)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChartOfAccountFormInput, unknown, ChartOfAccountFormValues>({
    resolver: zodResolver(chartOfAccountSchema),
    defaultValues,
  })

  const selectedType = useWatch({ control, name: 'type' })

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const submitForm = async (formValues: ChartOfAccountFormValues) => {
    setServerError('')

    try {
      await onSubmit({
        ...formValues,
        parent_id: formValues.parent_id || null,
        sub_type: formValues.sub_type || null,
        description: formValues.description || null,
      })
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof ChartOfAccountFormInput, {
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
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {account?.is_system && (
              <Alert severity="info">{t('coa.form.systemNotice')}</Alert>
            )}
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '160px 1fr' },
                gap: 2,
              }}
            >
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('coa.fields.code')}
                    error={!!errors.code}
                    helperText={errors.code?.message}
                    disabled={!!account?.is_system}
                    required
                  />
                )}
              />
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('coa.fields.name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={!!account?.is_system}
                    required
                  />
                )}
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label={t('coa.fields.type')}
                    error={!!errors.type}
                    helperText={errors.type?.message}
                    disabled={!!account?.is_system}
                    required
                  >
                    {accountTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {t(`coa.types.${type}`)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="normal_balance"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label={t('coa.fields.normalBalance')}
                    error={!!errors.normal_balance}
                    helperText={errors.normal_balance?.message}
                    disabled={!!account?.is_system}
                    required
                  >
                    {normalBalances.map((balance) => (
                      <MenuItem key={balance} value={balance}>
                        {t(`coa.normalBalances.${balance}`)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="sub_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('coa.fields.detailType')}
                    error={!!errors.sub_type}
                    helperText={errors.sub_type?.message}
                    disabled={!!account?.is_system}
                  />
                )}
              />
            </Box>

            <Controller
              name="parent_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  select
                  label={t('coa.fields.parent')}
                  error={!!errors.parent_id}
                  helperText={errors.parent_id?.message}
                  disabled={!!account?.is_system}
                >
                  <MenuItem value="">{t('coa.fields.noParent')}</MenuItem>
                  {availableParents
                    .filter((option) => option.type === selectedType)
                    .map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.code} - {option.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('coa.fields.description')}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={!!account?.is_system}
                  multiline
                  minRows={3}
                />
              )}
            />

            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                      disabled={!!account?.is_system}
                    />
                  }
                  label={t('coa.fields.active')}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving || !!account?.is_system}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
