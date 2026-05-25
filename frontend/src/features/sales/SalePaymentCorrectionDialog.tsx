'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, type FieldPath } from 'react-hook-form'
import { z } from 'zod'
import {
  Alert,
  Autocomplete,
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
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import type { ExchangeRate, PaymentAccount } from '@/types/accounting'
import type { SalePayment, SalePaymentCorrectionPayload, SalePaymentMethod } from '@/types/sales'

const paymentMethods: SalePaymentMethod[] = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other']

const schema = z.object({
  payment_account_id: z.string().uuid('Payment account is required'),
  payment_currency: z.enum(['USD', 'KHR']),
  payment_amount: z.coerce.number().gt(0),
  method: z.enum(['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other']),
  reference: z.string().max(120).optional().or(z.literal('')),
  payment_date: z.string().min(1),
  note: z.string().optional().or(z.literal('')),
  reason: z.string().trim().min(1).max(500),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface SalePaymentCorrectionDialogProps {
  open: boolean
  payment: SalePayment | null
  paymentAccounts: PaymentAccount[]
  defaultExchangeRate: ExchangeRate | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: SalePaymentCorrectionPayload) => Promise<void>
}

function toNumber(value: unknown) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

function exchangeRateValue(exchangeRate: ExchangeRate | null) {
  return toNumber(exchangeRate?.rate)
}

function valuesFromPayment(payment: SalePayment | null, paymentAccounts: PaymentAccount[]): FormInput {
  const defaultAccountId = paymentAccounts.find((account) => account.is_active)?.id ?? ''

  return {
    payment_account_id: payment?.payment_account_id ?? defaultAccountId,
    payment_currency: payment?.payment_currency ?? 'USD',
    payment_amount: toNumber(payment?.payment_amount ?? payment?.amount),
    method: payment?.method ?? 'cash',
    reference: payment?.reference ?? '',
    payment_date: payment?.payment_date ?? '',
    note: payment?.note ?? '',
    reason: '',
  }
}

export function SalePaymentCorrectionDialog({
  open,
  payment,
  paymentAccounts,
  defaultExchangeRate,
  isSaving,
  onClose,
  onSubmit,
}: SalePaymentCorrectionDialogProps) {
  const { t } = useTranslation(['sales', 'common'])
  const [serverError, setServerError] = useState('')
  const activeAccounts = useMemo(() => paymentAccounts.filter((account) => account.is_active), [paymentAccounts])
  const values = useMemo(() => valuesFromPayment(payment, activeAccounts), [payment, activeAccounts])
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  const paymentCurrency = watch('payment_currency')
  const paymentAmount = watch('payment_amount')

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const closeDialog = () => {
    setServerError('')
    onClose()
  }

  const changePaymentCurrency = (nextCurrency: 'USD' | 'KHR') => {
    const currentBaseAmount = paymentCurrency === 'KHR' && exchangeRateValue(defaultExchangeRate) > 0
      ? Math.round((toNumber(paymentAmount) / exchangeRateValue(defaultExchangeRate)) * 100) / 100
      : Math.round(toNumber(paymentAmount) * 100) / 100
    const nextPaymentAmount = nextCurrency === 'KHR' && exchangeRateValue(defaultExchangeRate) > 0
      ? Math.round(currentBaseAmount * exchangeRateValue(defaultExchangeRate) * 100) / 100
      : currentBaseAmount

    setValue('payment_currency', nextCurrency, { shouldDirty: true, shouldValidate: true })
    setValue('payment_amount', nextPaymentAmount, { shouldDirty: true, shouldValidate: true })
  }

  const submitForm = async (formValues: FormValues) => {
    setServerError('')

    try {
      const amount = formValues.payment_currency === 'KHR'
        ? Math.round((formValues.payment_amount / exchangeRateValue(defaultExchangeRate)) * 100) / 100
        : Math.round(formValues.payment_amount * 100) / 100

      await onSubmit({
        payment_account_id: formValues.payment_account_id,
        amount,
        payment_currency: formValues.payment_currency,
        payment_amount: formValues.payment_amount,
        exchange_rate_id: formValues.payment_currency === 'KHR' ? defaultExchangeRate?.id ?? null : null,
        method: formValues.method,
        reference: formValues.reference || null,
        payment_date: formValues.payment_date,
        note: formValues.note || null,
        reason: formValues.reason,
      })
      closeDialog()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as FieldPath<FormInput>, { type: 'server', message: messages[0] })
        })
      }
      setServerError(apiError.message)
    }
  }

  const convertedAmount = paymentCurrency === 'KHR' && exchangeRateValue(defaultExchangeRate) > 0
    ? Math.round((toNumber(paymentAmount) / exchangeRateValue(defaultExchangeRate)) * 100) / 100
    : Math.round(toNumber(paymentAmount) * 100) / 100

  return (
    <Dialog open={open} onClose={isSaving ? undefined : closeDialog} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <DialogTitle>{t('payment.editTitle')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <Alert severity="info">{t('payment.updateHelp')}</Alert>
            <Controller
              name="payment_account_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={activeAccounts}
                  value={activeAccounts.find((account) => account.id === field.value) ?? null}
                  getOptionLabel={(account) => account.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onBlur={field.onBlur}
                  onChange={(_, account) => field.onChange(account?.id ?? '')}
                  renderInput={(params) => (
                    <TextField {...params} label={t('payment.account')} error={!!errors.payment_account_id} helperText={errors.payment_account_id?.message} required />
                  )}
                />
              )}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '140px minmax(0, 1fr)' }, gap: 2 }}>
              <Controller
                name="payment_currency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('payment.currency')}
                    fullWidth
                    select
                    error={!!errors.payment_currency}
                    helperText={errors.payment_currency?.message}
                    required
                    onChange={(event) => changePaymentCurrency(event.target.value as 'USD' | 'KHR')}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="KHR" disabled={!defaultExchangeRate}>KHR</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="payment_amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('payment.amount')}
                    fullWidth
                    type="number"
                    error={!!errors.payment_amount}
                    helperText={errors.payment_amount?.message}
                    required
                    slotProps={{
                      htmlInput: { min: 0.01, step: 0.01 },
                      input: { startAdornment: <InputAdornment position="start">{paymentCurrency}</InputAdornment> },
                    }}
                  />
                )}
              />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('payment.converted')}: USD {convertedAmount.toFixed(2)}
            </Typography>
            <Controller
              name="method"
              control={control}
              render={({ field }) => (
                <TextField {...field} label={t('payment.method')} fullWidth select error={!!errors.method} helperText={errors.method?.message} required>
                  {paymentMethods.map((method) => (
                    <MenuItem key={method} value={method}>
                      {t(`paymentMethods.${method}`)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="reference"
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label={t('payment.reference')} fullWidth error={!!errors.reference} helperText={errors.reference?.message} />
              )}
            />
            <Controller
              name="payment_date"
              control={control}
              render={({ field }) => (
                <AppDatePicker label={t('payment.date')} value={field.value} onChange={field.onChange} error={!!errors.payment_date} helperText={errors.payment_date?.message} required />
              )}
            />
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label={t('payment.note')} fullWidth error={!!errors.note} helperText={errors.note?.message} />
              )}
            />
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label={t('payment.reason')} fullWidth required multiline minRows={2} error={!!errors.reason} helperText={errors.reason?.message} />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={closeDialog} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving || activeAccounts.length === 0}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('payment.editAction')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
