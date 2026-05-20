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
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { useAppCurrency } from '@/features/settings/useAppCurrency'
import { paymentAccountSchema, type PaymentAccountFormInput, type PaymentAccountFormValues } from './schema'
import type { ChartOfAccount, PaymentAccount, PaymentAccountPayload, PaymentAccountType } from '@/types/accounting'

interface PaymentAccountFormDialogProps {
  open: boolean
  account: PaymentAccount | null
  chartAccounts: ChartOfAccount[]
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: PaymentAccountPayload) => Promise<void>
}

const accountTypes: PaymentAccountType[] = ['cash', 'bank', 'other']

const defaultValues: PaymentAccountFormInput = {
  name: '',
  account_type: 'cash',
  account_number: '',
  bank_name: '',
  opening_balance: 0,
  coa_account_id: null,
  is_active: true,
  note: '',
}

function accountToFormValues(account: PaymentAccount | null): PaymentAccountFormInput {
  if (!account) return defaultValues

  return {
    name: account.name,
    account_type: account.type,
    account_number: account.account_number ?? '',
    bank_name: account.bank_name ?? '',
    opening_balance: account.opening_balance,
    coa_account_id: account.chart_of_account?.id ?? null,
    is_active: account.is_active,
    note: account.note ?? '',
  }
}

export function PaymentAccountFormDialog({
  open,
  account,
  chartAccounts,
  isSaving,
  onClose,
  onSubmit,
}: PaymentAccountFormDialogProps) {
  const { t } = useTranslation(['accounting', 'common'])
  const [serverError, setServerError] = useState('')
  const currency = useAppCurrency()
  const title = account ? t('paymentAccounts.form.editTitle') : t('paymentAccounts.form.createTitle')
  const values = useMemo(() => accountToFormValues(account), [account])
  const coaOptions = chartAccounts.filter((chartAccount) => chartAccount.is_active && chartAccount.is_postable)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PaymentAccountFormInput, unknown, PaymentAccountFormValues>({
    resolver: zodResolver(paymentAccountSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const submitForm = async (formValues: PaymentAccountFormValues) => {
    setServerError('')

    try {
      await onSubmit({
        ...formValues,
        account_number: formValues.account_number || null,
        bank_name: formValues.bank_name || null,
        coa_account_id: formValues.coa_account_id || null,
        note: formValues.note || null,
      })
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof PaymentAccountFormInput, {
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
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 180px' },
                gap: 2,
              }}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('paymentAccounts.fields.name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    required
                  />
                )}
              />
              <Controller
                name="account_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label={t('paymentAccounts.fields.type')}
                    error={!!errors.account_type}
                    helperText={errors.account_type?.message}
                    required
                  >
                    {accountTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {t(`paymentAccounts.types.${type}`)}
                      </MenuItem>
                    ))}
                  </TextField>
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
                name="bank_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('paymentAccounts.fields.bankName')}
                    error={!!errors.bank_name}
                    helperText={errors.bank_name?.message}
                  />
                )}
              />
              <Controller
                name="account_number"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('paymentAccounts.fields.accountNumber')}
                    error={!!errors.account_number}
                    helperText={errors.account_number?.message}
                  />
                )}
              />
              <Controller
                name="opening_balance"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t('paymentAccounts.fields.openingBalance')}
                    error={!!errors.opening_balance}
                    helperText={errors.opening_balance?.message}
                    slotProps={{
                      htmlInput: { min: 0, step: 0.01 },
                      input: {
                        startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
                      },
                    }}
                  />
                )}
              />
            </Box>

            <Controller
              name="coa_account_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  select
                  label={t('paymentAccounts.fields.chartAccount')}
                  error={!!errors.coa_account_id}
                  helperText={errors.coa_account_id?.message}
                >
                  <MenuItem value="">{t('paymentAccounts.fields.noChartAccount')}</MenuItem>
                  {coaOptions.map((chartAccount) => (
                    <MenuItem key={chartAccount.id} value={chartAccount.id}>
                      {chartAccount.code} - {chartAccount.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('paymentAccounts.fields.note')}
                  error={!!errors.note}
                  helperText={errors.note?.message}
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
                    />
                  }
                  label={t('paymentAccounts.fields.active')}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
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
