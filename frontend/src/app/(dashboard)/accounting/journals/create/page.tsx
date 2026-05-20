'use client'

import NextLink from 'next/link'
import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
import { ArrowBack, DeleteOutlined, ReceiptLongOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { useChartOfAccountsQuery, useCreateJournalMutation } from '@/features/accounting/hooks'
import { journalSchema, type JournalFormInput, type JournalFormValues } from '@/features/accounting/schema'
import { useAppCurrency, useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import type { JournalEntryType, JournalPayload } from '@/types/accounting'

const defaultValues: JournalFormInput = {
  description: '',
  posted_at: '',
  entries: [
    { account_id: '', type: 'debit', amount: 0, description: '' },
    { account_id: '', type: 'credit', amount: 0, description: '' },
  ],
}

function lineTotal(entries: JournalFormInput['entries'], type: JournalEntryType) {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((total, entry) => total + Number(entry.amount || 0), 0)
}

export default function CreateJournalPage() {
  const { t } = useTranslation(['accounting', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const accountsQuery = useChartOfAccountsQuery({ status: 'active', per_page: 100 })
  const createJournal = useCreateJournalMutation()
  const currency = useAppCurrency()
  const currencyFormatter = useCurrencyFormatter()
  const accountOptions = useMemo(
    () => (accountsQuery.data?.data ?? []).filter((account) => account.is_active && account.is_postable),
    [accountsQuery.data?.data]
  )

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<JournalFormInput, unknown, JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'entries' })
  const entries = useWatch({ control, name: 'entries' })
  const debitTotal = lineTotal(entries, 'debit')
  const creditTotal = lineTotal(entries, 'credit')
  const balanced = Math.round(debitTotal * 100) === Math.round(creditTotal * 100) && debitTotal > 0

  const submitForm = async (values: JournalFormValues) => {
    setServerError('')

    const payload: JournalPayload = {
      description: values.description,
      posted_at: values.posted_at || null,
      entries: values.entries.map((entry) => ({
        account_id: entry.account_id,
        type: entry.type,
        amount: entry.amount,
        description: entry.description || null,
      })),
    }

    try {
      await createJournal.mutateAsync(payload)
      enqueueSnackbar(t('journals.messages.created'), { variant: 'success' })
      router.push('/accounting/journals')
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof JournalFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Tooltip title={t('common:buttons.back')}>
          <IconButton component={NextLink} href="/accounting/journals" size="small" aria-label={t('common:buttons.back')}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <ReceiptLongOutlined color="primary" />
            <Typography variant="h4">{t('journals.create.title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('journals.create.subtitle')}
          </Typography>
        </Box>
      </Stack>

      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <Stack spacing={3}>
          <Card>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Stack spacing={2.5}>
                {serverError && <Alert severity="error">{serverError}</Alert>}
                {accountsQuery.isError && (
                  <Alert severity="error">{toAppApiError(accountsQuery.error).message}</Alert>
                )}
                {!accountsQuery.isLoading && accountOptions.length === 0 && (
                  <Alert severity="warning">{t('journals.create.noAccounts')}</Alert>
                )}

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 220px' },
                    gap: 2,
                  }}
                >
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={t('journals.fields.description')}
                        error={!!errors.description}
                        helperText={errors.description?.message}
                        required
                      />
                    )}
                  />
                  <Controller
                    name="posted_at"
                    control={control}
                    render={({ field }) => (
                      <AppDatePicker
                        label={t('journals.fields.date')}
                        value={field.value ?? null}
                        onChange={field.onChange}
                        error={!!errors.posted_at}
                        helperText={errors.posted_at?.message}
                      />
                    )}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Stack spacing={2.5}>
                {errors.entries?.message && (
                  <Alert severity="error">{errors.entries.message}</Alert>
                )}

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('journals.entries.account')}</TableCell>
                        <TableCell sx={{ width: 160 }}>{t('journals.entries.type')}</TableCell>
                        <TableCell sx={{ width: 180 }}>{t('journals.entries.amount')}</TableCell>
                        <TableCell>{t('journals.entries.description')}</TableCell>
                        <TableCell align="right" sx={{ width: 72 }}>{t('journals.columns.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Controller
                              name={`entries.${index}.account_id`}
                              control={control}
                              render={({ field: accountField }) => (
                                <TextField
                                  {...accountField}
                                  select
                                  fullWidth
                                  size="small"
                                  error={!!errors.entries?.[index]?.account_id}
                                  helperText={errors.entries?.[index]?.account_id?.message}
                                >
                                  {accountOptions.map((account) => (
                                    <MenuItem key={account.id} value={account.id}>
                                      {account.code} - {account.name}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Controller
                              name={`entries.${index}.type`}
                              control={control}
                              render={({ field: typeField }) => (
                                <TextField {...typeField} select fullWidth size="small">
                                  <MenuItem value="debit">{t('journals.entries.debit')}</MenuItem>
                                  <MenuItem value="credit">{t('journals.entries.credit')}</MenuItem>
                                </TextField>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Controller
                              name={`entries.${index}.amount`}
                              control={control}
                              render={({ field: amountField }) => (
                                <TextField
                                  {...amountField}
                                  type="number"
                                  fullWidth
                                  size="small"
                                  error={!!errors.entries?.[index]?.amount}
                                  helperText={errors.entries?.[index]?.amount?.message}
                                  slotProps={{
                                    htmlInput: { min: 0.01, step: 0.01 },
                                    input: {
                                      startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
                                    },
                                  }}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Controller
                              name={`entries.${index}.description`}
                              control={control}
                              render={({ field: descriptionField }) => (
                                <TextField
                                  {...descriptionField}
                                  value={descriptionField.value ?? ''}
                                  fullWidth
                                  size="small"
                                  error={!!errors.entries?.[index]?.description}
                                  helperText={errors.entries?.[index]?.description?.message}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title={t('common:buttons.delete')}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={fields.length <= 2}
                                  onClick={() => remove(index)}
                                  aria-label={t('common:buttons.delete')}
                                >
                                  <DeleteOutlined />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => append({ account_id: '', type: 'debit', amount: 0, description: '' })}
                  >
                    {t('journals.actions.addLine')}
                  </Button>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
                    <Typography variant="body2" sx={{ color: balanced ? 'success.main' : 'error.main' }}>
                      {t('journals.create.totals', {
                        debit: currencyFormatter.format(debitTotal),
                        credit: currencyFormatter.format(creditTotal),
                      })}
                    </Typography>
                    <Button component={NextLink} href="/accounting/journals" variant="outlined" disabled={createJournal.isPending}>
                      {t('common:buttons.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={createJournal.isPending || accountsQuery.isLoading || accountOptions.length === 0}
                    >
                      {createJournal.isPending ? <CircularProgress size={20} color="inherit" /> : t('journals.actions.post')}
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  )
}
