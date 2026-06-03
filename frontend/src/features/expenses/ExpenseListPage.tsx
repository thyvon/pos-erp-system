'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Add, ExpandLess, ExpandMore, PaymentsOutlined, Search, TuneOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
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

const rowsPerPageOptions = [10, 25, 50]

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
  const [filtersOpen, setFiltersOpen] = useState(false)
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
  const activeAdvancedFilterCount = [branchFilter, dateFrom, dateTo].filter(Boolean).length
  const filterToggleLabel = `${t(filtersOpen ? 'filters.hideAdvanced' : 'filters.showAdvanced')}${
    activeAdvancedFilterCount > 0 ? ` (${activeAdvancedFilterCount})` : ''
  }`

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
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <PaymentsOutlined color="primary" />
            <Typography variant="h4">{t('title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('subtitle')}
          </Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
            {t('actions.create')}
          </Button>
        )}
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={2} sx={{ mb: 2.5 }}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={2}
              sx={{ alignItems: { xs: 'stretch', lg: 'center' } }}
            >
              <TextField
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(0)
                }}
                placeholder={t('filters.search')}
                sx={{ flexGrow: 1 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                variant="outlined"
                startIcon={<TuneOutlined />}
                endIcon={filtersOpen ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setFiltersOpen((open) => !open)}
                sx={{ minWidth: { xs: '100%', lg: 190 }, justifyContent: 'space-between' }}
              >
                {filterToggleLabel}
              </Button>
            </Stack>
            <Collapse in={filtersOpen} timeout="auto">
              <Stack
                direction={{ xs: 'column', lg: 'row' }}
                spacing={2}
                sx={{
                  alignItems: { xs: 'stretch', lg: 'center' },
                  overflowX: { lg: 'auto' },
                  pt: 0.5,
                  pb: { lg: 0.5 },
                }}
              >
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
              </Stack>
            </Collapse>
          </Stack>

          {expensesQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(expensesQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.date')}</TableCell>
                  <TableCell>{t('columns.reference')}</TableCell>
                  <TableCell>{t('columns.description')}</TableCell>
                  <TableCell>{t('columns.branch')}</TableCell>
                  <TableCell>{t('columns.account')}</TableCell>
                  <TableCell align="right">{t('columns.amount')}</TableCell>
                  <TableCell align="center">{t('common:buttons.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expensesQuery.isLoading && <TableStateRow colSpan={7} loading />}
                {!expensesQuery.isLoading && !expensesQuery.data?.data?.length && (
                  <TableStateRow colSpan={7} message={t('empty')} />
                )}
                {(expensesQuery.data?.data ?? []).map((expense: Expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>{formatAppDate(expense.expense_date, dateFormat, i18n.language)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {expense.reference_no || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 250 }} noWrap>
                        {expense.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{expense.branch?.name ?? '-'}</TableCell>
                    <TableCell>
                      {expense.expense_account
                        ? `${expense.expense_account.code} - ${expense.expense_account.name}`
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatMoney(parseFloat(expense.amount), currencyFormatter)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={expensesQuery.data?.meta?.total ?? 0}
            page={page}
            rowsPerPage={perPage}
            rowsPerPageOptions={rowsPerPageOptions}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => {
              setPerPage(Number(event.target.value))
              setPage(0)
            }}
          />
        </CardContent>
      </Card>

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
