'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { ArrowBack, DeleteOutlined, EditOutlined } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useSnackbar } from 'notistack'
import { toAppApiError } from '@/api/errors'
import PageLoader from '@/components/ui/PageLoader'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import { useAuthStore } from '@/stores/authStore'
import { useExpenseQuery, useDeleteExpenseMutation, useUpdateExpenseMutation } from './hooks'
import { ExpenseFormDialog } from './ExpenseFormDialog'
import type { ExpensePayload } from '@/types/expense'

interface ExpenseDetailPageProps {
  expenseId: string
}

export function ExpenseDetailPage({ expenseId }: ExpenseDetailPageProps) {
  const { t, i18n } = useTranslation(['expenses', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const currencyFormatter = useCurrencyFormatter()
  const dateFormat = useAppDateFormat()
  const { data: expense, isLoading, isError, error } = useExpenseQuery(expenseId)
  const deleteMutation = useDeleteExpenseMutation()
  const updateMutation = useUpdateExpenseMutation()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(expenseId)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      router.push('/expenses')
    } catch (err) {
      enqueueSnackbar(toAppApiError(err).message, { variant: 'error' })
    }
  }

  const handleEditSubmit = async (payload: ExpensePayload) => {
    await updateMutation.mutateAsync({ id: expenseId, payload })
    enqueueSnackbar(t('messages.updated'), { variant: 'success' })
    setEditOpen(false)
  }

  if (isLoading) {
    return <PageLoader />
  }

  if (isError) {
    return <Alert severity="error">{toAppApiError(error).message}</Alert>
  }

  if (!expense) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">{t('empty')}</Typography>
      </Box>
    )
  }

  return (
    <>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
        <Tooltip title={t('detail.back')}>
          <IconButton size="small" onClick={() => router.push('/expenses')} aria-label={t('detail.back')}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <Typography variant="h4">{t('detail.title')}</Typography>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {expense.description}
                </Typography>
                {expense.reference_no && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {expense.reference_no}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {can('expenses.edit') && (
                  <Button
                    variant="outlined"
                    startIcon={<EditOutlined />}
                    onClick={() => setEditOpen(true)}
                  >
                    {t('common:buttons.edit')}
                  </Button>
                )}
                {can('expenses.delete') && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlined />}
                    onClick={() => setDeleteOpen(true)}
                  >
                    {t('common:buttons.delete')}
                  </Button>
                )}
              </Box>
            </Box>

            <Divider />

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>{t('detail.field')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('detail.value')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell variant="head">{t('detail.expenseDate')}</TableCell>
                    <TableCell>{formatAppDate(expense.expense_date, dateFormat, i18n.language)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">{t('detail.branch')}</TableCell>
                    <TableCell>{expense.branch?.name ?? '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">{t('detail.expenseAccount')}</TableCell>
                    <TableCell>
                      {expense.expense_account
                        ? `${expense.expense_account.code} - ${expense.expense_account.name}`
                        : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">{t('detail.paymentAccount')}</TableCell>
                    <TableCell>{expense.payment_account?.name ?? '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">{t('detail.paymentMethod')}</TableCell>
                    <TableCell>
                      {expense.payment_method
                        ? t(`paymentMethods.${expense.payment_method}`)
                        : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">{t('detail.amount')}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {formatMoney(parseFloat(expense.amount), currencyFormatter)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">{t('detail.notes')}</TableCell>
                    <TableCell>{expense.notes || t('detail.noNotes')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">{t('detail.createdBy')}</TableCell>
                    <TableCell>{expense.creator?.name ?? '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell variant="head">{t('detail.createdAt')}</TableCell>
                    <TableCell>{formatAppDateTime(expense.created_at, dateFormat, i18n.language)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        title={t('delete.title')}
        message={t('delete.message')}
        confirmText={t('common:buttons.delete')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteMutation.isPending}
        confirmColor="error"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <ExpenseFormDialog
        open={editOpen}
        expense={expense}
        isSaving={updateMutation.isPending}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />
    </>
  )
}
