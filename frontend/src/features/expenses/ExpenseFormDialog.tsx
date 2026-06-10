'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useChartOfAccountsQuery } from '@/features/accounting/hooks'
import { usePaymentAccountsQuery } from '@/features/accounting/hooks'
import { emptyExpenseValues, expenseSchema, valuesFromExpense, type ExpenseFormInput, type ExpenseFormValues } from './schema'
import type { Expense, ExpensePayload } from '@/types/expense'
import type { ChartOfAccount, PaymentAccount } from '@/types/accounting'
import type { Branch } from '@/types/branch'

const paymentMethods = ['cash', 'bank', 'card', 'other'] as const

interface ExpenseFormDialogProps {
  open: boolean
  expense?: Expense | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: ExpensePayload) => Promise<void>
}

function buildExpensePayload(values: ExpenseFormValues): ExpensePayload {
  return {
    branch_id: values.branch_id,
    expense_account_id: values.expense_account_id,
    payment_account_id: values.payment_account_id,
    expense_date: values.expense_date,
    reference_no: values.reference_no || null,
    description: values.description.trim(),
    amount: values.amount,
    payment_method: values.payment_method || null,
    notes: values.notes || null,
  }
}

export function ExpenseFormDialog({ open, expense, isSaving, onClose, onSubmit }: ExpenseFormDialogProps) {
  const { t } = useTranslation(['expenses', 'common'])
  const isEdit = !!expense
  const [serverError, setServerError] = useState('')

  const branchesQuery = useBranchesQuery({ is_active: true, per_page: 100 })
  const { data: coaData } = useChartOfAccountsQuery({ type: 'expense', per_page: 200 })
  const { data: paymentAccountData } = usePaymentAccountsQuery({ status: 'active', per_page: 200 })

  const formValues = useMemo<ExpenseFormInput>(
    () => (expense ? valuesFromExpense(expense) : emptyExpenseValues),
    [expense],
  )

  const branches: Branch[] = branchesQuery.data?.data ?? []
  const expenseAccounts: ChartOfAccount[] = coaData?.data ?? []
  const paymentAccounts: PaymentAccount[] = (paymentAccountData?.data ?? []).filter((account) => account.chart_of_account)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: emptyExpenseValues,
  })

  useEffect(() => {
    if (open) {
      reset(formValues)
    }
  }, [formValues, open, reset])

  const handleClose = () => {
    setServerError('')
    onClose()
  }

  const submitForm = async (values: ExpenseFormValues) => {
    setServerError('')

    try {
      await onSubmit(buildExpensePayload(values))
      handleClose()
    } catch (err) {
      const apiError = toAppApiError(err)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof ExpenseFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : handleClose} fullWidth maxWidth="md">
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <DialogTitle>{isEdit ? t('form.edit') : t('form.create')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
              <Controller
                name="branch_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={branches}
                    loading={branchesQuery.isLoading}
                    value={branches.find((branch) => branch.id === field.value) ?? null}
                    onChange={(_, value) => field.onChange(value?.id ?? '')}
                    getOptionLabel={(branch: Branch) => branch.name}
                    isOptionEqualToValue={(option: Branch, value: Branch) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('form.branch')}
                        required
                        error={!!errors.branch_id}
                        helperText={errors.branch_id?.message}
                      />
                    )}
                  />
                )}
              />
              <Controller
                name="expense_account_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={expenseAccounts}
                    value={expenseAccounts.find((account) => account.id === field.value) ?? null}
                    onChange={(_, value) => field.onChange(value?.id ?? '')}
                    getOptionLabel={(account: ChartOfAccount) => `${account.code} - ${account.name}`}
                    isOptionEqualToValue={(option: ChartOfAccount, value: ChartOfAccount) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('form.expenseAccount')}
                        required
                        error={!!errors.expense_account_id}
                        helperText={errors.expense_account_id?.message}
                      />
                    )}
                  />
                )}
              />
              <Controller
                name="payment_account_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={paymentAccounts}
                    value={paymentAccounts.find((account) => account.id === field.value) ?? null}
                    onChange={(_, value) => field.onChange(value?.id ?? '')}
                    getOptionLabel={(account: PaymentAccount) => account.name}
                    isOptionEqualToValue={(option: PaymentAccount, value: PaymentAccount) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('form.paymentAccount')}
                        required
                        error={!!errors.payment_account_id}
                        helperText={errors.payment_account_id?.message}
                      />
                    )}
                  />
                )}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
              <Controller
                name="expense_date"
                control={control}
                render={({ field }) => (
                  <AppDatePicker
                    label={t('form.expenseDate')}
                    value={field.value}
                    onChange={(value) => field.onChange(value ?? '')}
                    required
                  />
                )}
              />
              <Controller
                name="reference_no"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('form.referenceNo')}
                    error={!!errors.reference_no}
                    helperText={errors.reference_no?.message}
                  />
                )}
              />
              <Controller
                name="payment_method"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.payment_method}>
                    <InputLabel id="payment-method-label">{t('form.paymentMethod')}</InputLabel>
                    <Select
                      {...field}
                      MenuProps={{ disableScrollLock: true }}
                      value={field.value ?? ''}
                      labelId="payment-method-label"
                      label={t('form.paymentMethod')}
                    >
                      <MenuItem value="">{t('form.noPaymentMethod')}</MenuItem>
                      {paymentMethods.map((method) => (
                        <MenuItem key={method} value={method}>
                          {t(`paymentMethods.${method}`)}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.payment_method?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('form.description')}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    required
                    multiline
                    minRows={2}
                  />
                )}
              />
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('form.amount')}
                    type="number"
                    value={field.value ?? ''}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    required
                    slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                  />
                )}
              />
            </Box>

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('form.notes')}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                  multiline
                  minRows={2}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {t(isEdit ? 'common:buttons.save' : 'common:buttons.create')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
