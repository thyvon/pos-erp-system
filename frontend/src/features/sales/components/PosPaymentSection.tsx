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
import { Controller, type Control, type FieldArrayWithId, type FieldErrors } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Add, DeleteOutlined } from '@/components/ui/icons'
import type { PaymentAccount } from '@/types/accounting'
import type { DirectPaymentLineInput } from '../formHelpers'
import type { SaleFormInput, SaleFormValues } from '../schema'

const paymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other'] as const

const paymentColumnSx = {
  account: { width: 260, minWidth: 260 },
  currency: { width: 112, minWidth: 112 },
  amount: { width: 160, minWidth: 160 },
  method: { width: 180, minWidth: 180 },
  actions: { width: 64, minWidth: 64 },
} as const

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

  const renderPaymentLineFields = (field: FieldArrayWithId<SaleFormInput, 'direct_payments', 'fieldId'>, index: number, compact = false) => {
    const line = watchedDirectPayments[index]
    const isExistingPaymentLine = !!line?.sale_payment_id
    const lineDisabled = isSaving || (isExistingPaymentLine ? !canManageExistingPayments : !canAddPaymentLines)
    const removeDisabled = isSaving || directPaymentFields.length === 1 || (isExistingPaymentLine && !canDeleteExistingPayments)

    return {
      key: field.fieldId,
      account: (
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
                  label={compact ? undefined : t('payment.account')}
                  placeholder={compact ? t('payment.account') : undefined}
                  error={!!errors.direct_payments?.[index]?.payment_account_id}
                  helperText={errors.direct_payments?.[index]?.payment_account_id?.message}
                  required
                />
              )}
            />
          )}
        />
      ),
      currency: (
        <Controller
          name={`direct_payments.${index}.payment_currency`}
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              value={field.value ?? 'USD'}
              select
              disabled={lineDisabled}
              label={compact ? undefined : t('payment.currency')}
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
      ),
      amount: (
        <Controller
          name={`direct_payments.${index}.payment_amount`}
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              value={field.value ?? ''}
              type="number"
              disabled={lineDisabled}
              label={compact ? undefined : t('payment.amount')}
              placeholder={compact ? t('payment.amount') : undefined}
              error={!!errors.direct_payments?.[index]?.payment_amount}
              helperText={errors.direct_payments?.[index]?.payment_amount?.message}
              required
              slotProps={{
                htmlInput: { min: 0.01, step: 0.01, style: { textAlign: 'right' } },
                input: {
                  startAdornment: <InputAdornment position="start">{watchedDirectPayments[index]?.payment_currency ?? 'USD'}</InputAdornment>,
                },
              }}
            />
          )}
        />
      ),
      method: (
        <Controller
          name={`direct_payments.${index}.method`}
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              value={field.value ?? 'cash'}
              select
              disabled={lineDisabled}
              label={compact ? undefined : t('payment.method')}
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
      ),
      actions: (
        <Tooltip title={t('payment.removeLine')}>
          <span>
            <IconButton
              size="small"
              color="error"
              disabled={removeDisabled}
              onClick={() => onRemoveLine(index)}
            >
              <DeleteOutlined />
            </IconButton>
          </span>
        </Tooltip>
      ),
    }
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(220px, 260px)' },
        alignItems: 'stretch',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ minWidth: 0, p: 1.25 }}>
        {canCapturePayment && (
          <Stack spacing={1}>
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

            <TableContainer sx={{ display: { xs: 'none', md: 'block' }, border: 1, borderColor: 'divider', borderRadius: 1, maxHeight: 260, overflow: 'auto' }}>
              <Table stickyHeader size="small" sx={{ minWidth: 776, tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={paymentColumnSx.account}>{t('payment.account')}</TableCell>
                    <TableCell sx={paymentColumnSx.currency}>{t('payment.currency')}</TableCell>
                    <TableCell sx={paymentColumnSx.amount} align="right">{t('payment.amount')}</TableCell>
                    <TableCell sx={paymentColumnSx.method}>{t('payment.method')}</TableCell>
                    <TableCell sx={paymentColumnSx.actions} align="center">{t('columns.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {directPaymentFields.map((field, index) => {
                    const lineFields = renderPaymentLineFields(field, index, true)

                    return (
                      <TableRow key={lineFields.key}>
                        <TableCell sx={paymentColumnSx.account}>{lineFields.account}</TableCell>
                        <TableCell sx={paymentColumnSx.currency}>{lineFields.currency}</TableCell>
                        <TableCell sx={paymentColumnSx.amount} align="right">{lineFields.amount}</TableCell>
                        <TableCell sx={paymentColumnSx.method}>{lineFields.method}</TableCell>
                        <TableCell sx={paymentColumnSx.actions} align="center">{lineFields.actions}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack spacing={1} sx={{ display: { xs: 'flex', md: 'none' } }}>
              {directPaymentFields.map((field, index) => {
                const lineFields = renderPaymentLineFields(field, index)

                return (
                  <Box key={lineFields.key} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                    <Stack spacing={1}>
                      {lineFields.account}
                      <Box sx={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 1 }}>
                        {lineFields.currency}
                        {lineFields.amount}
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                        <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>{lineFields.method}</Box>
                        {lineFields.actions}
                      </Stack>
                    </Stack>
                  </Box>
                )
              })}
            </Stack>
          </Stack>
        )}
      </Box>
      <Box
        sx={{
          p: 1.5,
          bgcolor: 'success.lighter',
          textAlign: 'center',
          display: 'grid',
          alignContent: 'center',
          borderTop: { xs: 1, lg: 0 },
          borderLeft: { lg: 1 },
          borderColor: 'divider',
          minWidth: 0,
        }}
      >
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
