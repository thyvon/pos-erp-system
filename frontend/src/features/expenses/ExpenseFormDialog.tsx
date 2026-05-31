'use client'

import { useMemo, useState } from 'react'
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
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useChartOfAccountsQuery } from '@/features/accounting/hooks'
import { usePaymentAccountsQuery } from '@/features/accounting/hooks'
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

function today() {
  return dayjs().format('YYYY-MM-DD')
}

function createInitialState(expense?: Expense | null) {
  return {
    branchId: expense?.branch_id ?? '',
    expenseAccountId: expense?.expense_account_id ?? '',
    paymentAccountId: expense?.payment_account_id ?? '',
    expenseDate: expense?.expense_date ?? today(),
    referenceNo: expense?.reference_no ?? '',
    description: expense?.description ?? '',
    amount: expense ? (typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount) : ('' as number | ''),
    paymentMethod: expense?.payment_method ?? '',
    notes: expense?.notes ?? '',
  }
}

export function ExpenseFormDialog({ open, expense, isSaving, onClose, onSubmit }: ExpenseFormDialogProps) {
  const { t } = useTranslation(['expenses', 'common'])
  const isEdit = !!expense

  const [state, setState] = useState(createInitialState(expense))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')

  const branchesQuery = useBranchesQuery({ is_active: true, per_page: 100 })
  const { data: coaData } = useChartOfAccountsQuery({ type: 'expense', per_page: 200 })
  const { data: paymentAccountData } = usePaymentAccountsQuery({ per_page: 200 })

  const formKey = useMemo(() => (open ? (expense?.id ?? 'create') : 'closed'), [open, expense?.id])

  const branches: Branch[] = branchesQuery.data?.data ?? []
  const expenseAccounts: ChartOfAccount[] = coaData?.data ?? []
  const paymentAccounts: PaymentAccount[] = paymentAccountData?.data ?? []

  const update = (field: string, value: unknown) => setState((prev) => ({ ...prev, [field]: value }))

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!state.branchId) newErrors.branch_id = t('common:required')
    if (!state.expenseAccountId) newErrors.expense_account_id = t('common:required')
    if (!state.paymentAccountId) newErrors.payment_account_id = t('common:required')
    if (!state.expenseDate) newErrors.expense_date = t('common:required')
    if (!state.description.trim()) newErrors.description = t('common:required')
    if (state.amount === '' || Number(state.amount) <= 0) newErrors.amount = t('common:required')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setServerError('')

    const payload: ExpensePayload = {
      branch_id: state.branchId,
      expense_account_id: state.expenseAccountId,
      payment_account_id: state.paymentAccountId,
      expense_date: state.expenseDate,
      reference_no: state.referenceNo || null,
      description: state.description.trim(),
      amount: Number(state.amount),
      payment_method: state.paymentMethod || null,
      notes: state.notes || null,
    }

    try {
      await onSubmit(payload)
      onClose()
    } catch (err) {
      setServerError(toAppApiError(err).message)
    }
  }

  return (
    <Dialog key={formKey} open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="md">
      <Box component="form" noValidate onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSubmit() }}>
        <DialogTitle>{isEdit ? t('form.edit') : t('form.create')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
              <Autocomplete
                options={branches}
                loading={branchesQuery.isLoading}
                value={branches.find((b) => b.id === state.branchId) ?? null}
                onChange={(_, v) => update('branchId', v?.id ?? '')}
                getOptionLabel={(b: Branch) => b.name}
                isOptionEqualToValue={(a: Branch, b: Branch) => a.id === b.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('form.branch')}
                    required
                    error={!!errors.branch_id}
                    helperText={errors.branch_id}
                  />
                )}
              />
              <Autocomplete
                options={expenseAccounts}
                value={expenseAccounts.find((a) => a.id === state.expenseAccountId) ?? null}
                onChange={(_, v) => update('expenseAccountId', v?.id ?? '')}
                getOptionLabel={(a: ChartOfAccount) => `${a.code} - ${a.name}`}
                isOptionEqualToValue={(a: ChartOfAccount, b: ChartOfAccount) => a.id === b.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('form.expenseAccount')}
                    required
                    error={!!errors.expense_account_id}
                    helperText={errors.expense_account_id}
                  />
                )}
              />
              <Autocomplete
                options={paymentAccounts}
                value={paymentAccounts.find((a) => a.id === state.paymentAccountId) ?? null}
                onChange={(_, v) => update('paymentAccountId', v?.id ?? '')}
                getOptionLabel={(a: PaymentAccount) => a.name}
                isOptionEqualToValue={(a: PaymentAccount, b: PaymentAccount) => a.id === b.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('form.paymentAccount')}
                    required
                    error={!!errors.payment_account_id}
                    helperText={errors.payment_account_id}
                  />
                )}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
              <AppDatePicker
                label={t('form.expenseDate')}
                value={state.expenseDate}
                onChange={(v) => update('expenseDate', v ?? '')}
                required
              />
              <TextField
                label={t('form.referenceNo')}
                value={state.referenceNo}
                onChange={(e) => update('referenceNo', e.target.value)}
                error={!!errors.reference_no}
                helperText={errors.reference_no}
              />
              <FormControl error={!!errors.payment_method}>
                <InputLabel id="payment-method-label">{t('form.paymentMethod')}</InputLabel>
                <Select
                  labelId="payment-method-label"
                  label={t('form.paymentMethod')}
                  value={state.paymentMethod}
                  onChange={(e) => update('paymentMethod', e.target.value)}
                >
                  <MenuItem value="">--</MenuItem>
                  {paymentMethods.map((m) => (
                    <MenuItem key={m} value={m}>
                      {t(`paymentMethods.${m}`)}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.payment_method}</FormHelperText>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
              <TextField
                label={t('form.description')}
                value={state.description}
                onChange={(e) => update('description', e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
                required
                multiline
                minRows={2}
              />
              <TextField
                label={t('form.amount')}
                type="number"
                value={state.amount === '' ? '' : state.amount}
                onChange={(e) => update('amount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                error={!!errors.amount}
                helperText={errors.amount}
                required
              />
            </Box>

            <TextField
              label={t('form.notes')}
              value={state.notes}
              onChange={(e) => update('notes', e.target.value)}
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSaving}>
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
