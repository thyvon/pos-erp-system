'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm, useWatch, type FieldPath } from 'react-hook-form'
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
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { Add, DeleteOutlined } from '@/components/ui/icons'
import { useAppCurrency } from '@/features/settings/useAppCurrency'
import { purchasePaymentSchema, type PurchasePaymentFormInput, type PurchasePaymentFormValues } from './schema'
import type { ExchangeRate, PaymentAccount } from '@/types/accounting'
import type { Purchase, PurchasePayment, PurchasePaymentCorrectionPayload, PurchasePaymentMethod, PurchasePaymentPayload } from '@/types/purchase'

interface PurchasePaymentDialogProps {
  open: boolean
  purchase: Purchase | null
  paymentAccounts: PaymentAccount[]
  defaultExchangeRate: ExchangeRate | null
  isExchangeRateLoading?: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: PurchasePaymentPayload) => Promise<void>
  existingPayment?: PurchasePayment | null
  onUpdate?: (paymentId: string, payload: PurchasePaymentCorrectionPayload) => Promise<void>
}

const paymentMethods: PurchasePaymentMethod[] = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other']

const paymentColumnSx = {
  account: { width: 260 },
  currency: { width: 120 },
  amount: { width: 180 },
  method: { width: 180 },
  reference: { width: 220 },
  converted: { width: 160 },
  actions: { width: 72 },
}

function toNumber(value: unknown) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

function exchangeRateValue(exchangeRate: ExchangeRate | null) {
  return toNumber(exchangeRate?.rate)
}

function baseAmount(line: Partial<PurchasePaymentFormInput['payments'][number]> | null | undefined, exchangeRate: ExchangeRate | null) {
  const paymentAmount = toNumber(line?.payment_amount)
  const rate = exchangeRateValue(exchangeRate)

  if (line?.payment_currency === 'KHR') {
    return rate > 0 ? Math.round((paymentAmount / rate) * 100) / 100 : 0
  }

  return Math.round(paymentAmount * 100) / 100
}

function newPaymentLine(paymentAccounts: PaymentAccount[]): PurchasePaymentFormInput['payments'][number] {
  return {
    payment_account_id: paymentAccounts.find((account) => account.is_active)?.id ?? '',
    payment_currency: 'USD',
    payment_amount: 0,
    amount: 0,
    exchange_rate_id: null,
    method: 'cash',
    reference: '',
  }
}

function defaultValues(purchase: Purchase | null, paymentAccounts: PaymentAccount[], existingPayment: PurchasePayment | null): PurchasePaymentFormInput {
  const due = Math.max(toNumber(purchase?.total_amount) - toNumber(purchase?.paid_amount), 0)

  if (existingPayment) {
    return {
      payment_date: existingPayment.payment_date ?? dayjs().format('YYYY-MM-DD'),
      note: existingPayment.note ?? '',
      reason: '',
      payments: [
        {
          payment_account_id: existingPayment.payment_account_id,
          payment_currency: existingPayment.payment_currency,
          payment_amount: toNumber(existingPayment.payment_amount ?? existingPayment.amount),
          amount: toNumber(existingPayment.amount),
          exchange_rate_id: existingPayment.exchange_rate_id,
          method: existingPayment.method,
          reference: existingPayment.reference ?? '',
        },
      ],
    }
  }

  return {
    payment_date: dayjs().format('YYYY-MM-DD'),
    note: '',
    payments: [
      {
        ...newPaymentLine(paymentAccounts),
        amount: due,
        payment_amount: due,
      },
    ],
  }
}

export function PurchasePaymentDialog({
  open,
  purchase,
  paymentAccounts,
  defaultExchangeRate,
  isExchangeRateLoading = false,
  isSaving,
  onClose,
  onSubmit,
  existingPayment = null,
  onUpdate,
}: PurchasePaymentDialogProps) {
  const isEdit = !!existingPayment
  const { t } = useTranslation(['purchases', 'common'])
  const currency = useAppCurrency()
  const [serverError, setServerError] = useState('')
  const activeAccounts = useMemo(
    () => paymentAccounts.filter((account) => account.is_active),
    [paymentAccounts],
  )
  const values = useMemo(() => defaultValues(purchase, activeAccounts, existingPayment), [purchase, activeAccounts, existingPayment])
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PurchasePaymentFormInput, unknown, PurchasePaymentFormValues>({
    resolver: zodResolver(purchasePaymentSchema),
    defaultValues: values,
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'payments',
    keyName: 'fieldId',
  })
  const watchedPayments = useWatch({ control, name: 'payments' })
  const due = Math.max(toNumber(purchase?.total_amount) - toNumber(purchase?.paid_amount), 0)
  const enteredTotal = (watchedPayments ?? []).reduce((total, line) => total + baseAmount(line, defaultExchangeRate), 0)
  const remaining = Math.max(due - enteredTotal, 0)

  useEffect(() => {
    if (open) {
      reset(values)
    }
  }, [open, reset, values])

  const closeDialog = () => {
    setServerError('')
    onClose()
  }

  const changePaymentCurrency = (index: number, nextCurrency: 'USD' | 'KHR') => {
    const currentLine = watchedPayments?.[index]
    const currentBaseAmount = baseAmount(currentLine, defaultExchangeRate)
    const rate = exchangeRateValue(defaultExchangeRate)
    const nextPaymentAmount = nextCurrency === 'KHR' && rate > 0
      ? Math.round(currentBaseAmount * rate * 100) / 100
      : currentBaseAmount

    setValue(`payments.${index}.payment_currency`, nextCurrency, { shouldDirty: true, shouldValidate: true })
    setValue(`payments.${index}.payment_amount`, nextPaymentAmount, { shouldDirty: true, shouldValidate: true })
    setValue(`payments.${index}.amount`, currentBaseAmount, { shouldDirty: true, shouldValidate: true })
    setValue(`payments.${index}.exchange_rate_id`, nextCurrency === 'KHR' ? defaultExchangeRate?.id ?? null : null, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const submitForm = async (formValues: PurchasePaymentFormValues) => {
    setServerError('')

    if (isEdit) {
      if (!formValues.reason?.trim()) {
        setError('reason', { type: 'manual', message: t('payment.reasonRequired') })
        return
      }

      if (!existingPayment || !onUpdate) return

      try {
        const line = formValues.payments[0]
        const convertedAmount = baseAmount(line, defaultExchangeRate)

        await onUpdate(existingPayment.id, {
          payment_account_id: line.payment_account_id,
          amount: convertedAmount,
          payment_currency: line.payment_currency,
          payment_amount: line.payment_amount,
          exchange_rate_id: line.payment_currency === 'KHR' ? defaultExchangeRate?.id ?? null : null,
          method: line.method,
          reference: line.reference || null,
          payment_date: formValues.payment_date,
          note: formValues.note || null,
          reason: formValues.reason.trim(),
        })
        closeDialog()
      } catch (error) {
        const apiError = toAppApiError(error)
        if (apiError.fieldErrors) {
          Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
            setError(field as FieldPath<PurchasePaymentFormInput>, {
              type: 'server',
              message: messages[0],
            })
          })
        }
        setServerError(apiError.message)
      }
      return
    }

    try {
      await onSubmit({
        payment_date: formValues.payment_date,
        note: formValues.note || null,
        payments: formValues.payments.map((line) => {
          const convertedAmount = baseAmount(line, defaultExchangeRate)

          return {
            payment_account_id: line.payment_account_id,
            amount: convertedAmount,
            payment_currency: line.payment_currency,
            payment_amount: line.payment_amount,
            exchange_rate_id: line.payment_currency === 'KHR' ? defaultExchangeRate?.id ?? null : null,
            method: line.method,
            reference: line.reference || null,
            payment_date: formValues.payment_date,
            note: formValues.note || null,
          }
        }),
      })
      closeDialog()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as FieldPath<PurchasePaymentFormInput>, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : closeDialog} fullWidth maxWidth="lg">
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <DialogTitle>{isEdit ? t('payment.editTitle') : t('payment.title')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            {activeAccounts.length === 0 && (
              <Alert severity="warning">{t('payment.noAccounts')}</Alert>
            )}
            {!isExchangeRateLoading && !defaultExchangeRate && (
              <Alert severity="info">{t('payment.noExchangeRate')}</Alert>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: isEdit ? '1fr 1fr' : '1fr 1fr' },
                gap: 2,
              }}
            >
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
                name="note"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('payment.note')}
                    error={!!errors.note}
                    helperText={errors.note?.message}
                  />
                )}
              />
              {isEdit && (
                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      label={t('payment.reason')}
                      error={!!errors.reason}
                      helperText={errors.reason?.message}
                      required
                      multiline
                      minRows={2}
                    />
                  )}
                />
              )}
            </Box>

            <Divider />

            <Stack spacing={1.5}>
              {!isEdit && (
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography variant="subtitle2">{t('payment.lines')}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {t('payment.totalEntered')}: {currency} {enteredTotal.toFixed(2)} | {t('payment.remaining')}: {currency} {remaining.toFixed(2)}
                    </Typography>
                  </Box>
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => append(newPaymentLine(activeAccounts))}
                    disabled={isSaving || activeAccounts.length === 0}
                  >
                    {t('payment.addLine')}
                  </Button>
                </Stack>
              )}

              <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                <Table sx={{ minWidth: isEdit ? 1146 : 1218, tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={paymentColumnSx.account}>{t('payment.account')}</TableCell>
                      <TableCell sx={paymentColumnSx.currency}>{t('payment.currency')}</TableCell>
                      <TableCell sx={paymentColumnSx.amount} align="right">{t('payment.amount')}</TableCell>
                      <TableCell sx={paymentColumnSx.method}>{t('payment.method')}</TableCell>
                      <TableCell sx={paymentColumnSx.reference}>{t('payment.reference')}</TableCell>
                      <TableCell sx={paymentColumnSx.converted} align="right">{t('payment.converted')}</TableCell>
                      {!isEdit && <TableCell sx={paymentColumnSx.actions} align="right">{t('columns.actions')}</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.fieldId}>
                        <TableCell sx={paymentColumnSx.account}>
                          <Controller
                            name={`payments.${index}.payment_account_id`}
                            control={control}
                            render={({ field }) => (
                              <Autocomplete
                                fullWidth
                                options={activeAccounts}
                                value={activeAccounts.find((account) => account.id === field.value) ?? null}
                                getOptionLabel={(account) => account.name}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                onBlur={field.onBlur}
                                onChange={(_, account) => field.onChange(account?.id ?? '')}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    error={!!errors.payments?.[index]?.payment_account_id}
                                    helperText={errors.payments?.[index]?.payment_account_id?.message}
                                    required
                                  />
                                )}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell sx={paymentColumnSx.currency}>
                          <Controller
                            name={`payments.${index}.payment_currency`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                select
                                error={!!errors.payments?.[index]?.payment_currency}
                                helperText={errors.payments?.[index]?.payment_currency?.message}
                                required
                                onChange={(event) => changePaymentCurrency(index, event.target.value as 'USD' | 'KHR')}
                              >
                                <MenuItem value="USD">USD</MenuItem>
                                <MenuItem value="KHR" disabled={!defaultExchangeRate}>KHR</MenuItem>
                              </TextField>
                            )}
                          />
                        </TableCell>
                        <TableCell align="right" sx={paymentColumnSx.amount}>
                          <Controller
                            name={`payments.${index}.payment_amount`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                type="number"
                                error={!!errors.payments?.[index]?.payment_amount}
                                helperText={errors.payments?.[index]?.payment_amount?.message}
                                required
                                slotProps={{
                                  htmlInput: { min: 0.01, step: 0.01 },
                                  input: {
                                    startAdornment: <InputAdornment position="start">{watchedPayments?.[index]?.payment_currency ?? 'USD'}</InputAdornment>,
                                  },
                                }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell sx={paymentColumnSx.method}>
                          <Controller
                            name={`payments.${index}.method`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                select
                                error={!!errors.payments?.[index]?.method}
                                helperText={errors.payments?.[index]?.method?.message}
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
                        </TableCell>
                        <TableCell sx={paymentColumnSx.reference}>
                          <Controller
                            name={`payments.${index}.reference`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                value={field.value ?? ''}
                                fullWidth
                                error={!!errors.payments?.[index]?.reference}
                                helperText={errors.payments?.[index]?.reference?.message}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell align="right" sx={paymentColumnSx.converted}>
                          <Typography variant="body2">
                            {currency} {baseAmount(watchedPayments?.[index], defaultExchangeRate).toFixed(2)}
                          </Typography>
                          {watchedPayments?.[index]?.payment_currency === 'KHR' && defaultExchangeRate && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              1 USD = {Number(defaultExchangeRate.rate ?? 0).toLocaleString()} KHR
                            </Typography>
                          )}
                        </TableCell>
                        {!isEdit && (
                          <TableCell align="right" sx={paymentColumnSx.actions}>
                            <Tooltip title={t('payment.removeLine')}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={isSaving || fields.length === 1}
                                  onClick={() => remove(index)}
                                >
                                  <DeleteOutlined />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={closeDialog} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving || activeAccounts.length === 0}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : (isEdit ? t('payment.save') : t('payment.record'))}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
