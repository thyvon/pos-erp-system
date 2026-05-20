'use client'

import { useEffect, useState } from 'react'
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
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { useAppCurrency } from '@/features/settings/useAppCurrency'
import {
  paymentAccountTransferSchema,
  type PaymentAccountTransferFormInput,
  type PaymentAccountTransferFormValues,
} from './schema'
import type { PaymentAccount, PaymentAccountTransferPayload } from '@/types/accounting'

interface PaymentAccountTransferDialogProps {
  open: boolean
  accounts: PaymentAccount[]
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: PaymentAccountTransferPayload) => Promise<void>
}

const defaultValues: PaymentAccountTransferFormInput = {
  from_payment_account_id: '',
  to_payment_account_id: '',
  amount: 0,
  transaction_date: dayjs().format('YYYY-MM-DD'),
  note: '',
}

export function PaymentAccountTransferDialog({
  open,
  accounts,
  isSaving,
  onClose,
  onSubmit,
}: PaymentAccountTransferDialogProps) {
  const { t } = useTranslation(['accounting', 'common'])
  const [serverError, setServerError] = useState('')
  const currency = useAppCurrency()
  const activeLinkedAccounts = accounts.filter((account) => account.is_active && !!account.chart_of_account)
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PaymentAccountTransferFormInput, unknown, PaymentAccountTransferFormValues>({
    resolver: zodResolver(paymentAccountTransferSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, reset])

  const submitForm = async (values: PaymentAccountTransferFormValues) => {
    setServerError('')

    try {
      await onSubmit({
        ...values,
        note: values.note || null,
      })
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof PaymentAccountTransferFormInput, {
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
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <DialogTitle>{t('paymentAccounts.transfer.title')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            {activeLinkedAccounts.length < 2 && (
              <Alert severity="warning">{t('paymentAccounts.transfer.needAccounts')}</Alert>
            )}

            <Controller
              name="from_payment_account_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={t('paymentAccounts.transfer.from')}
                  error={!!errors.from_payment_account_id}
                  helperText={errors.from_payment_account_id?.message}
                  required
                >
                  {activeLinkedAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="to_payment_account_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={t('paymentAccounts.transfer.to')}
                  error={!!errors.to_payment_account_id}
                  helperText={errors.to_payment_account_id?.message}
                  required
                >
                  {activeLinkedAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label={t('paymentAccounts.transfer.amount')}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    required
                    slotProps={{
                      htmlInput: { min: 0.01, step: 0.01 },
                      input: {
                        startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
                      },
                    }}
                  />
                )}
              />
              <Controller
                name="transaction_date"
                control={control}
                render={({ field }) => (
                  <AppDatePicker
                    label={t('paymentAccounts.transfer.date')}
                    value={field.value ?? null}
                    onChange={field.onChange}
                    error={!!errors.transaction_date}
                    helperText={errors.transaction_date?.message}
                    required
                  />
                )}
              />
            </Box>

            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('paymentAccounts.transfer.note')}
                  error={!!errors.note}
                  helperText={errors.note?.message}
                  multiline
                  minRows={3}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving || activeLinkedAccounts.length < 2}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('paymentAccounts.actions.transfer')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
