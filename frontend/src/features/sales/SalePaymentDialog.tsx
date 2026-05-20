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
import { salePaymentSchema, type SalePaymentFormInput, type SalePaymentFormValues } from './schema'
import type { PaymentAccount } from '@/types/accounting'
import type { Sale, SalePaymentMethod, SalePaymentPayload } from '@/types/sales'

interface SalePaymentDialogProps {
  open: boolean
  sale: Sale | null
  paymentAccounts: PaymentAccount[]
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: SalePaymentPayload) => Promise<void>
}

const paymentMethods: SalePaymentMethod[] = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other']

function toNumber(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

function defaultValues(sale: Sale | null): SalePaymentFormInput {
  const due = Math.max(toNumber(sale?.total_amount) - toNumber(sale?.paid_amount), 0)

  return {
    payment_account_id: '',
    amount: due,
    method: 'cash',
    reference: '',
    payment_date: dayjs().format('YYYY-MM-DD'),
    note: '',
  }
}

export function SalePaymentDialog({
  open,
  sale,
  paymentAccounts,
  isSaving,
  onClose,
  onSubmit,
}: SalePaymentDialogProps) {
  const { t } = useTranslation(['sales', 'common'])
  const currency = useAppCurrency()
  const [serverError, setServerError] = useState('')
  const values = useMemo(() => defaultValues(sale), [sale])
  const activeAccounts = paymentAccounts.filter((account) => account.is_active)
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<SalePaymentFormInput, unknown, SalePaymentFormValues>({
    resolver: zodResolver(salePaymentSchema),
    defaultValues: values,
  })

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const submitForm = async (formValues: SalePaymentFormValues) => {
    setServerError('')

    try {
      await onSubmit({
        ...formValues,
        reference: formValues.reference || null,
        note: formValues.note || null,
      })
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof SalePaymentFormInput, {
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
        <DialogTitle>{t('payment.title')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            {activeAccounts.length === 0 && (
              <Alert severity="warning">{t('payment.noAccounts')}</Alert>
            )}
            <Controller
              name="payment_account_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={t('payment.account')}
                  error={!!errors.payment_account_id}
                  helperText={errors.payment_account_id?.message}
                  required
                >
                  {activeAccounts.map((account) => (
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
                    label={t('payment.amount')}
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
                name="method"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label={t('payment.method')}
                    error={!!errors.method}
                    helperText={errors.method?.message}
                    required
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method} value={method}>
                        {t(`paymentMethods.${method}`)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
            <Controller
              name="payment_date"
              control={control}
              render={({ field }) => (
                <AppDatePicker
                  label={t('payment.date')}
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.payment_date}
                  helperText={errors.payment_date?.message}
                  required
                />
              )}
            />
            <Controller
              name="reference"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('payment.reference')}
                  error={!!errors.reference}
                  helperText={errors.reference?.message}
                />
              )}
            />
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('payment.note')}
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
          <Button type="submit" variant="contained" disabled={isSaving || activeAccounts.length === 0}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('actions.recordPayment')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
