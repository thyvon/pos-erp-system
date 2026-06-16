'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material'
import { Add, PaymentsOutlined } from '@/components/ui/icons'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import { useExpensesQuery, useDeleteExpenseMutation, useCreateExpenseMutation, useUpdateExpenseMutation } from './hooks'
import { ExpenseFormDialog } from './ExpenseFormDialog'
import type { Expense, ExpenseFilters, ExpensePayload } from '@/types/expense'
import type { Branch } from '@/types/branch'

export default function ExpensesPage() {
  const { t, i18n } = useTranslation(['expenses', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [branchFilter, setBranchFilter] = useState('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()

  const filters: ExpenseFilters = useMemo(
    () => ({
      search: search || undefined,
      branch_id: branchFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [search, branchFilter, dateFrom, dateTo, page, perPage],
  )

  const expensesQuery = useExpensesQuery(filters)
  const deleteMutation = useDeleteExpenseMutation()
  const createMutation = useCreateExpenseMutation()
  const updateMutation = useUpdateExpenseMutation()

  const branchesQuery = useBranchesQuery({ is_active: true, per_page: 100 })
  const branches = branchesQuery.data?.data ?? []
  const canCreate = can('expenses.create')
  const canEdit = can('expenses.edit')
  const canDelete = can('expenses.delete')

  const columns = useMemo<EntityTableColumn<Expense>[]>(
    () => [
      {
        key: 'date',
        label: t('columns.date'),
        render: (expense) => formatAppDate(expense.expense_date, dateFormat, i18n.language),
      },
      {
        key: 'reference',
        label: t('columns.reference'),
        render: (expense) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {expense.reference_no || '-'}
          </Typography>
        ),
      },
      {
        key: 'description',
        label: t('columns.description'),
        render: (expense) => (
          <Typography variant="body2" sx={{ maxWidth: 250 }} noWrap>
            {expense.description}
          </Typography>
        ),
      },
      {
        key: 'branch',
        label: t('columns.branch'),
        render: (expense) => expense.branch?.name ?? '-',
      },
      {
        key: 'account',
        label: t('columns.account'),
        render: (expense) =>
          expense.expense_account
            ? `${expense.expense_account.code} - ${expense.expense_account.name}`
            : '-',
      },
      {
        key: 'amount',
        label: t('columns.amount'),
        align: 'right',
        render: (expense) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatMoney(parseFloat(expense.amount), currencyFormatter)}
          </Typography>
        ),
      },
    ],
    [currencyFormatter, dateFormat, i18n.language, t]
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeleteTarget(null)
    } catch (err) {
      enqueueSnackbar(toAppApiError(err).message, { variant: 'error' })
    }
  }

  const handleCreateSubmit = async (payload: ExpensePayload) => {
    const result = await createMutation.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    router.push(`/expenses/${result.id}`)
  }

  const handleEditSubmit = async (payload: ExpensePayload) => {
    if (!editTarget) return

    await updateMutation.mutateAsync({ id: editTarget.id, payload })
    enqueueSnackbar(t('messages.updated'), { variant: 'success' })
    setEditTarget(null)
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<PaymentsOutlined color="primary" />}
        title={t('title')}
        description={t('subtitle')}
        actions={canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
            {t('actions.create')}
          </Button>
        )}
      />

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('filters.search')}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(0)
        }}
        filterButtonLabel={t('filters.showAdvanced')}
        filters={
          <>
            <SearchableFilterSelect
              value={branchFilter}
              options={branches}
              loading={branchesQuery.isLoading}
              label={t('filters.branch')}
              placeholder={t('filters.allBranches')}
              getOptionValue={(branch: Branch) => branch.id}
              getOptionLabel={(branch: Branch) => branch.name}
              onChange={(value) => {
                setBranchFilter(value)
                setPage(0)
              }}
              sx={{ minWidth: { xs: '100%', lg: 190 } }}
            />
            <Box sx={{ minWidth: { xs: '100%', lg: 165 } }}>
              <AppDatePicker
                label={t('filters.dateFrom')}
                value={dateFrom}
                onChange={(value) => {
                  setDateFrom(value)
                  setPage(0)
                }}
                maxDate={dateTo}
              />
            </Box>
            <Box sx={{ minWidth: { xs: '100%', lg: 165 } }}>
              <AppDatePicker
                label={t('filters.dateTo')}
                value={dateTo}
                onChange={(value) => {
                  setDateTo(value)
                  setPage(0)
                }}
                minDate={dateFrom}
              />
            </Box>
          </>
        }
      />

      {expensesQuery.isError && (
        <Alert severity="error">
          {toAppApiError(expensesQuery.error).message}
        </Alert>
      )}

      <EntityTable
        rows={expensesQuery.data?.data ?? []}
        columns={columns}
        getRowKey={(expense) => expense.id}
        loading={expensesQuery.isLoading}
        emptyTitle={t('empty')}
        pagination={{
          page,
          rowsPerPage: perPage,
          count: expensesQuery.data?.meta?.total ?? 0,
          onPageChange: setPage,
          onRowsPerPageChange: (nextPerPage) => {
            setPerPage(nextPerPage)
            setPage(0)
          },
        }}
        rowActions={(expense) => (
          <RowActions
            viewLabel={t('common:buttons.view')}
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showView
            showEdit={canEdit}
            showDelete={canDelete}
            onView={() => router.push(`/expenses/${expense.id}`)}
            onEdit={() => setEditTarget(expense)}
            onDelete={() => setDeleteTarget(expense)}
          />
        )}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('delete.title')}
        message={t('delete.message')}
        confirmText={t('common:buttons.delete')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteMutation.isPending}
        confirmColor="error"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ExpenseFormDialog
        open={dialogOpen}
        isSaving={createMutation.isPending}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <ExpenseFormDialog
        open={!!editTarget}
        expense={editTarget}
        isSaving={updateMutation.isPending}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEditSubmit}
      />
    </Stack>
  )
}
