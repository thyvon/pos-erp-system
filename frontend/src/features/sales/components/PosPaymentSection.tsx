'use client'

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Controller, type Control, type FieldArrayWithId, type FieldErrors } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Add, DeleteOutlined } from '@/components/ui/icons'
import type { PaymentAccount } from '@/types/accounting'
import type { DirectPaymentLineInput } from '../formHelpers'
import type { SaleFormInput, SaleFormValues } from '../schema'

const paymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other'] as const

type AmountDisplay = {
  usd: string
  khr: string
}

interface PosPaymentSectionProps {
  control: Control<SaleFormInput, unknown, SaleFormValues>
  errors: FieldErrors<SaleFormInput>
  canCapturePayment: boolean
  canAddPaymentLines: boolean
  canManageExistingPayments: boolean
  canDeleteExistingPayments: boolean
  isSaving: boolean
  paymentAccounts: PaymentAccount[]
  paymentAccountsLoading: boolean
  defaultExchangeRateLoading: boolean
  hasDefaultExchangeRate: boolean
  directPaymentFields: Array<FieldArrayWithId<SaleFormInput, 'direct_payments', 'fieldId'>>
  watchedDirectPayments: DirectPaymentLineInput[]
  totalDisplay: AmountDisplay
  paymentDisplay: AmountDisplay
  remainingDisplay: AmountDisplay
  changeDisplay: AmountDisplay
  change: number
  onAddLine: () => void
  onCurrencyChange: (index: number, value: 'USD' | 'KHR') => void
  onRemoveLine: (index: number) => void
}

function paymentAccountLabel(account: PaymentAccount) {
  return [account.name, account.type].filter(Boolean).join(' / ')
}

export function PosPaymentSection({
  control,
  errors,
  canCapturePayment,
  canAddPaymentLines,
  canManageExistingPayments,
  canDeleteExistingPayments,
  isSaving,
  paymentAccounts,
  paymentAccountsLoading,
  defaultExchangeRateLoading,
  hasDefaultExchangeRate,
  directPaymentFields,
  watchedDirectPayments,
  totalDisplay,
  paymentDisplay,
  remainingDisplay,
  changeDisplay,
  change,
  onAddLine,
  onCurrencyChange,
  onRemoveLine,
}: PosPaymentSectionProps) {
  const { t } = useTranslation(['sales'])

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 280px' },
        alignItems: 'stretch',
      }}
    >
      <Box sx={{ p: 1.5 }}>
        {canCapturePayment && (
          <Stack spacing={1.25}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2">{t('payment.directTitle')}</Typography>
              <Button
                type="button"
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={onAddLine}
                disabled={isSaving || paymentAccounts.length === 0 || !canAddPaymentLines}
              >
                {t('payment.addLine')}
              </Button>
            </Stack>
            {paymentAccounts.length === 0 && <Alert severity="warning">{t('payment.noAccounts')}</Alert>}
            {!defaultExchangeRateLoading && !hasDefaultExchangeRate && <Alert severity="info">{t('payment.noExchangeRate')}</Alert>}
            {typeof errors.direct_payments?.message === 'string' && <Alert severity="error">{errors.direct_payments.message}</Alert>}
            {directPaymentFields.map((field, index) => {
              const line = watchedDirectPayments[index]
              const isExistingPaymentLine = !!line?.sale_payment_id
              const lineDisabled = isSaving
                || (isExistingPaymentLine ? !canManageExistingPayments : !canAddPaymentLines)

              return (
                <Box
                  key={field.fieldId}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(180px, 1fr) 92px 150px 150px 48px' },
                    gap: 1,
                    alignItems: 'start',
                  }}
                >
                  <Controller
                    name={`direct_payments.${index}.payment_account_id`}
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        fullWidth
                        disabled={lineDisabled}
                        options={paymentAccounts}
                        value={paymentAccounts.find((account) => account.id === field.value) ?? null}
                        loading={paymentAccountsLoading}
                        getOptionLabel={paymentAccountLabel}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        onBlur={field.onBlur}
                        onChange={(_, account) => field.onChange(account?.id ?? '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t('payment.account')}
                            error={!!errors.direct_payments?.[index]?.payment_account_id}
                            helperText={errors.direct_payments?.[index]?.payment_account_id?.message}
                            required
                          />
                        )}
                      />
                    )}
                  />
                  <Controller
                    name={`direct_payments.${index}.payment_currency`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? 'USD'}
                        select
                        disabled={lineDisabled}
                        label={t('payment.currency')}
                        error={!!errors.direct_payments?.[index]?.payment_currency}
                        helperText={errors.direct_payments?.[index]?.payment_currency?.message}
                        required
                        onChange={(event) => onCurrencyChange(index, event.target.value as 'USD' | 'KHR')}
                      >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="KHR" disabled={!hasDefaultExchangeRate}>KHR</MenuItem>
                      </TextField>
                    )}
                  />
                  <Controller
                    name={`direct_payments.${index}.payment_amount`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        type="number"
                        disabled={lineDisabled}
                        label={t('payment.amount')}
                        error={!!errors.direct_payments?.[index]?.payment_amount}
                        helperText={errors.direct_payments?.[index]?.payment_amount?.message}
                        required
                        slotProps={{
                          htmlInput: { min: 0.01, step: 0.01 },
                          input: {
                            startAdornment: <InputAdornment position="start">{watchedDirectPayments[index]?.payment_currency ?? 'USD'}</InputAdornment>,
                          },
                        }}
                      />
                    )}
                  />
                  <Controller
                    name={`direct_payments.${index}.method`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value ?? 'cash'}
                        select
                        disabled={lineDisabled}
                        label={t('payment.method')}
                        error={!!errors.direct_payments?.[index]?.method}
                        helperText={errors.direct_payments?.[index]?.method?.message}
                        required
                      >
                        {paymentMethods.map((method) => (
                          <MenuItem key={method} value={method}>{t(`paymentMethods.${method}`)}</MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Tooltip title={t('payment.removeLine')}>
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={isSaving || directPaymentFields.length === 1 || (isExistingPaymentLine && !canDeleteExistingPayments)}
                        onClick={() => onRemoveLine(index)}
                      >
                        <DeleteOutlined />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              )
            })}
          </Stack>
        )}
      </Box>
      <Box sx={{ p: 1.5, bgcolor: 'success.lighter', textAlign: 'center', display: 'grid', alignContent: 'center' }}>
        <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 800, textTransform: 'uppercase' }}>{t('pos.totalPayable')}</Typography>
        <Typography variant="h4" sx={{ color: 'success.dark', fontWeight: 900 }}>{totalDisplay.usd.replace('USD ', '')}</Typography>
        <Typography variant="body2" sx={{ color: 'success.dark' }}>{totalDisplay.khr}</Typography>
        {canCapturePayment && (
          <Stack spacing={0.25} sx={{ mt: 1 }}>
            <Typography variant="caption">{t('payment.totalEntered')}: {paymentDisplay.usd}</Typography>
            <Typography variant="caption">{change > 0 ? t('payment.changeBack') : t('payment.remaining')}: {change > 0 ? changeDisplay.usd : remainingDisplay.usd}</Typography>
          </Stack>
        )}
      </Box>
    </Box>
  )
}
