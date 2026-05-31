'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { ArrowBack, EditOutlined } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useSnackbar } from 'notistack'
import { toAppApiError } from '@/api/errors'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { formatMoney } from '@/utils/formatMoney'
import { useAuthStore } from '@/stores/authStore'
import { useExpenseQuery, useDeleteExpenseMutation, useUpdateExpenseMutation } from './hooks'
import { ExpenseFormDialog } from './ExpenseFormDialog'
import type { ExpensePayload } from '@/types/expense'

interface ExpenseDetailPageProps {
  expenseId: string
}

export function ExpenseDetailPage({ expenseId }: ExpenseDetailPageProps) {
  const { t } = useTranslation(['expenses', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const currencyFormatter = useCurrencyFormatter()
  const { data: expense, isLoading } = useExpenseQuery(expenseId)
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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button
          size="small"
          variant="text"
          startIcon={<ArrowBack />}
          onClick={() => router.push('/expenses')}
        >
          {t('detail.back')}
        </Button>
        <Typography variant="h5">{t('detail.title')}</Typography>
      </Box>

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
                    size="small"
                    variant="outlined"
                    startIcon={<EditOutlined />}
                    onClick={() => setEditOpen(true)}
                  >
                    {t('common:buttons.edit')}
                  </Button>
                )}
                {can('expenses.delete') && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
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
                    <TableCell>{expense.expense_date}</TableCell>
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
                    <TableCell>{expense.created_at}</TableCell>
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
