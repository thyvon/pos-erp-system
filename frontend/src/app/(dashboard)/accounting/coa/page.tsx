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
import { AccountTreeOutlined, Add, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { ChartOfAccountFormDialog } from '@/features/accounting/ChartOfAccountFormDialog'
import {
  useChartOfAccountsQuery,
  useCreateChartOfAccountMutation,
  useDeleteChartOfAccountMutation,
  useUpdateChartOfAccountMutation,
} from '@/features/accounting/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { AccountStatus, AccountType, ChartOfAccount, ChartOfAccountFilters, ChartOfAccountPayload } from '@/types/accounting'

const rowsPerPageOptions = [10, 25, 50]
const accountTypes: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense']
const statuses: AccountStatus[] = ['active', 'inactive']

function countValue(value: number | null | undefined) {
  return value ?? 0
}

export default function ChartOfAccountsPage() {
  const { t } = useTranslation(['accounting', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<AccountType | ''>('')
  const [statusFilter, setStatusFilter] = useState<AccountStatus | ''>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<ChartOfAccount | null>(null)

  const filters: ChartOfAccountFilters = useMemo(
    () => ({
      search: search || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, statusFilter, typeFilter]
  )

  const optionsQuery = useChartOfAccountsQuery({ per_page: 100 })
  const accountsQuery = useChartOfAccountsQuery(filters)
  const createAccount = useCreateChartOfAccountMutation()
  const updateAccount = useUpdateChartOfAccountMutation()
  const deleteAccount = useDeleteChartOfAccountMutation()

  const accounts = accountsQuery.data?.data ?? []
  const parentOptions = optionsQuery.data?.data ?? []
  const summary = accountsQuery.data?.summary
  const meta = accountsQuery.data?.meta
  const canManage = can('accounting.coa')

  const openCreateForm = () => {
    setEditingAccount(null)
    setFormOpen(true)
  }

  const openEditForm = (account: ChartOfAccount) => {
    setEditingAccount(account)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: ChartOfAccountPayload) => {
    if (editingAccount) {
      await updateAccount.mutateAsync({ id: editingAccount.id, payload })
      enqueueSnackbar(t('coa.messages.updated'), { variant: 'success' })
      return
    }

    await createAccount.mutateAsync(payload)
    enqueueSnackbar(t('coa.messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingAccount) return

    try {
      await deleteAccount.mutateAsync(deletingAccount.id)
      enqueueSnackbar(t('coa.messages.deleted'), { variant: 'success' })
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
            <AccountTreeOutlined color="primary" />
            <Typography variant="h4">{t('coa.title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('coa.subtitle')}
          </Typography>
        </Box>
        {canManage && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('coa.actions.new')}
          </Button>
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
          ['postable', summary?.postable_accounts ?? 0],
          ['system', summary?.system_accounts ?? 0],
        ].map(([key, value]) => (
          <Card key={key}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t(`coa.summary.${key}`)}
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.75 }}>
                {value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
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
              placeholder={t('coa.filters.search')}
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
                setTypeFilter(event.target.value as AccountType | '')
                setPage(0)
              }}
              label={t('coa.filters.type')}
              sx={{ minWidth: { xs: '100%', lg: 180 } }}
            >
              <MenuItem value="">{t('coa.filters.allTypes')}</MenuItem>
              {accountTypes.map((type) => (
                <MenuItem key={type} value={type}>{t(`coa.types.${type}`)}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as AccountStatus | '')
                setPage(0)
              }}
              label={t('coa.filters.status')}
              sx={{ minWidth: { xs: '100%', lg: 180 } }}
            >
              <MenuItem value="">{t('coa.filters.allStatuses')}</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>{t(`coa.statuses.${status}`)}</MenuItem>
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
                  <TableCell>{t('coa.columns.account')}</TableCell>
                  <TableCell>{t('coa.columns.type')}</TableCell>
                  <TableCell>{t('coa.columns.balance')}</TableCell>
                  <TableCell>{t('coa.columns.parent')}</TableCell>
                  <TableCell>{t('coa.columns.status')}</TableCell>
                  <TableCell align="right">{t('coa.columns.activity')}</TableCell>
                  <TableCell align="right">{t('coa.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accountsQuery.isLoading && <TableStateRow colSpan={7} loading />}
                {!accountsQuery.isLoading && accounts.length === 0 && (
                  <TableStateRow colSpan={7} message={t('coa.empty')} />
                )}
                {accounts.map((account) => (
                  <TableRow key={account.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{account.code} - {account.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {account.detail_type || t('coa.labels.noDetailType')}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{t(`coa.types.${account.type}`)}</TableCell>
                    <TableCell>{t(`coa.normalBalances.${account.normal_balance}`)}</TableCell>
                    <TableCell>{account.parent ? `${account.parent.code} - ${account.parent.name}` : '-'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        <Chip
                          size="small"
                          label={t(`coa.statuses.${account.status}`)}
                          color={account.is_active ? 'success' : 'default'}
                          variant="outlined"
                        />
                        {account.is_system && (
                          <Chip size="small" label={t('coa.labels.system')} color="info" variant="outlined" />
                        )}
                        {account.is_postable && (
                          <Chip size="small" label={t('coa.labels.postable')} variant="outlined" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      {t('coa.labels.activityCounts', {
                        journals: countValue(account.journal_entries_count),
                        payments: countValue(account.payment_accounts_count),
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canManage && !account.is_system}
                        showDelete={canManage && !account.is_system}
                        deleteDisabled={deleteAccount.isPending}
                        onEdit={() => openEditForm(account)}
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

      <ChartOfAccountFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingAccount?.id ?? 'new'}`}
        open={formOpen}
        account={editingAccount}
        parentOptions={parentOptions}
        isSaving={createAccount.isPending || updateAccount.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingAccount}
        title={t('coa.deleteDialog.title')}
        message={t('coa.deleteDialog.message', { name: deletingAccount?.name ?? '' })}
        confirmText={t('coa.deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteAccount.isPending}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
