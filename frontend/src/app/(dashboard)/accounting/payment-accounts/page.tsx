'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  MenuItem,
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
import { AccountBalanceWalletOutlined, Add, CompareArrowsOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { PaymentAccountFormDialog } from '@/features/accounting/PaymentAccountFormDialog'
import { PaymentAccountTransferDialog } from '@/features/accounting/PaymentAccountTransferDialog'
import {
  useChartOfAccountsQuery,
  useCreatePaymentAccountMutation,
  useDeletePaymentAccountMutation,
  usePaymentAccountsQuery,
  useTransferPaymentAccountMutation,
  useUpdatePaymentAccountMutation,
} from '@/features/accounting/hooks'
import { useAuthStore } from '@/stores/authStore'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { formatMoney } from '@/utils/formatMoney'
import type {
  AccountStatus,
  PaymentAccount,
  PaymentAccountFilters,
  PaymentAccountPayload,
  PaymentAccountTransferPayload,
  PaymentAccountType,
} from '@/types/accounting'

const rowsPerPageOptions = [10, 25, 50]

const accountTypes: PaymentAccountType[] = ['cash', 'bank', 'other']
const statuses: AccountStatus[] = ['active', 'inactive']

export default function PaymentAccountsPage() {
  const { t } = useTranslation(['accounting', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<PaymentAccountType | ''>('')
  const [statusFilter, setStatusFilter] = useState<AccountStatus | ''>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<PaymentAccount | null>(null)

  const filters: PaymentAccountFilters = useMemo(
    () => ({
      search: search || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, statusFilter, typeFilter]
  )

  const accountsQuery = usePaymentAccountsQuery(filters)
  const transferOptionsQuery = usePaymentAccountsQuery({ status: 'active', per_page: 100 })
  const chartAccountsQuery = useChartOfAccountsQuery({ status: 'active', per_page: 100 })
  const createAccount = useCreatePaymentAccountMutation()
  const updateAccount = useUpdatePaymentAccountMutation()
  const deleteAccount = useDeletePaymentAccountMutation()
  const transferAccount = useTransferPaymentAccountMutation()
  const currencyFormatter = useCurrencyFormatter()

  const accounts = accountsQuery.data?.data ?? []
  const transferAccounts = transferOptionsQuery.data?.data ?? []
  const chartAccounts = chartAccountsQuery.data?.data ?? []
  const summary = accountsQuery.data?.summary
  const meta = accountsQuery.data?.meta
  const canManage = can('accounting.index')

  const openCreateForm = () => {
    setEditingAccount(null)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: PaymentAccountPayload) => {
    if (editingAccount) {
      await updateAccount.mutateAsync({ id: editingAccount.id, payload })
      enqueueSnackbar(t('paymentAccounts.messages.updated'), { variant: 'success' })
      return
    }

    await createAccount.mutateAsync(payload)
    enqueueSnackbar(t('paymentAccounts.messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleTransfer = async (payload: PaymentAccountTransferPayload) => {
    await transferAccount.mutateAsync(payload)
    enqueueSnackbar(t('paymentAccounts.messages.transferred'), { variant: 'success' })
  }

  const handleDelete = async () => {
    if (!deletingAccount) return

    try {
      await deleteAccount.mutateAsync(deletingAccount.id)
      enqueueSnackbar(t('paymentAccounts.messages.deleted'), { variant: 'success' })
      setDeletingAccount(null)
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
    }
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
            <AccountBalanceWalletOutlined color="primary" />
            <Typography variant="h4">{t('paymentAccounts.title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('paymentAccounts.subtitle')}
          </Typography>
        </Box>
        {canManage && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button startIcon={<CompareArrowsOutlined />} variant="outlined" onClick={() => setTransferOpen(true)}>
              {t('paymentAccounts.actions.transfer')}
            </Button>
            <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
              {t('paymentAccounts.actions.new')}
            </Button>
          </Stack>
        )}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {[
          ['total', summary?.total_accounts ?? 0],
          ['active', summary?.active_accounts ?? 0],
          ['bank', summary?.bank_accounts ?? 0],
          ['linked', summary?.linked_accounts ?? 0],
        ].map(([key, value]) => (
          <Card key={key}>
            <CardContent>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t(`paymentAccounts.summary.${key}`)}
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.75 }}>
                {value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', lg: 'center' }, mb: 2.5 }}
          >
            <TextField
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
              placeholder={t('paymentAccounts.filters.search')}
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
            <TextField
              select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value as PaymentAccountType | '')
                setPage(0)
              }}
              label={t('paymentAccounts.filters.type')}
              sx={{ minWidth: { xs: '100%', lg: 180 } }}
            >
              <MenuItem value="">{t('paymentAccounts.filters.allTypes')}</MenuItem>
              {accountTypes.map((type) => (
                <MenuItem key={type} value={type}>{t(`paymentAccounts.types.${type}`)}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as AccountStatus | '')
                setPage(0)
              }}
              label={t('paymentAccounts.filters.status')}
              sx={{ minWidth: { xs: '100%', lg: 180 } }}
            >
              <MenuItem value="">{t('paymentAccounts.filters.allStatuses')}</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>{t(`paymentAccounts.statuses.${status}`)}</MenuItem>
              ))}
            </TextField>
          </Stack>

          {accountsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(accountsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('paymentAccounts.columns.account')}</TableCell>
                  <TableCell>{t('paymentAccounts.columns.type')}</TableCell>
                  <TableCell>{t('paymentAccounts.columns.chartAccount')}</TableCell>
                  <TableCell align="right">{t('paymentAccounts.columns.openingBalance')}</TableCell>
                  <TableCell align="right">{t('paymentAccounts.columns.currentBalance')}</TableCell>
                  <TableCell>{t('paymentAccounts.columns.status')}</TableCell>
                  <TableCell align="center">{t('paymentAccounts.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accountsQuery.isLoading && <TableStateRow colSpan={7} loading />}
                {!accountsQuery.isLoading && accounts.length === 0 && (
                  <TableStateRow colSpan={7} message={t('paymentAccounts.empty')} />
                )}
                {accounts.map((account) => (
                  <TableRow key={account.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{account.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {account.bank_name || account.account_number
                            ? [account.bank_name, account.account_number].filter(Boolean).join(' / ')
                            : t('paymentAccounts.labels.noBankDetails')}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{t(`paymentAccounts.types.${account.type}`)}</TableCell>
                    <TableCell>
                      {account.chart_of_account
                        ? `${account.chart_of_account.code} - ${account.chart_of_account.name}`
                        : '-'}
                    </TableCell>
                    <TableCell align="right">{formatMoney(account.opening_balance, currencyFormatter)}</TableCell>
                    <TableCell align="right">{formatMoney(account.current_balance, currencyFormatter)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`paymentAccounts.statuses.${account.status}`)}
                        color={account.is_active ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canManage}
                        showDelete={canManage}
                        deleteDisabled={deleteAccount.isPending}
                        onEdit={() => {
                          setEditingAccount(account)
                          setFormOpen(true)
                        }}
                        onDelete={() => setDeletingAccount(account)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={meta?.total ?? 0}
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

      <PaymentAccountFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingAccount?.id ?? 'new'}`}
        open={formOpen}
        account={editingAccount}
        chartAccounts={chartAccounts}
        isSaving={createAccount.isPending || updateAccount.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <PaymentAccountTransferDialog
        open={transferOpen}
        accounts={transferAccounts}
        isSaving={transferAccount.isPending}
        onClose={() => setTransferOpen(false)}
        onSubmit={handleTransfer}
      />

      <ConfirmDialog
        open={!!deletingAccount}
        title={t('paymentAccounts.deleteDialog.title')}
        message={t('paymentAccounts.deleteDialog.message', { name: deletingAccount?.name ?? '' })}
        confirmText={t('paymentAccounts.deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteAccount.isPending}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
