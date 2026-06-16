'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { AccountTreeOutlined, Add } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { ChartOfAccountFormDialog } from '@/features/accounting/ChartOfAccountFormDialog'
import {
  useChartOfAccountsQuery,
  useCreateChartOfAccountMutation,
  useDeleteChartOfAccountMutation,
  useUpdateChartOfAccountMutation,
} from '@/features/accounting/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { AccountStatus, AccountType, ChartOfAccount, ChartOfAccountFilters, ChartOfAccountPayload } from '@/types/accounting'

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

  const columns: EntityTableColumn<ChartOfAccount>[] = useMemo(
    () => [
      {
        key: 'account',
        label: t('coa.columns.account'),
        render: (account) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{account.code} - {account.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {account.detail_type || t('coa.labels.noDetailType')}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'type',
        label: t('coa.columns.type'),
        render: (account) => t(`coa.types.${account.type}`),
      },
      {
        key: 'balance',
        label: t('coa.columns.balance'),
        render: (account) => t(`coa.normalBalances.${account.normal_balance}`),
      },
      {
        key: 'parent',
        label: t('coa.columns.parent'),
        render: (account) => account.parent ? `${account.parent.code} - ${account.parent.name}` : '-',
      },
      {
        key: 'status',
        label: t('coa.columns.status'),
        render: (account) => (
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
        ),
      },
      {
        key: 'activity',
        label: t('coa.columns.activity'),
        align: 'right',
        render: (account) => t('coa.labels.activityCounts', {
          journals: countValue(account.journal_entries_count),
          payments: countValue(account.payment_accounts_count),
        }),
      },
    ],
    [t]
  )

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
    <Stack spacing={2.5}>
      <PageHeader
        icon={<AccountTreeOutlined color="primary" />}
        title={t('coa.title')}
        description={t('coa.subtitle')}
        actions={canManage && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('coa.actions.new')}
          </Button>
        )}
      />

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
            <CardContent>
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

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('coa.filters.search')}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(0)
        }}
        defaultFiltersOpen
        filters={(
          <>
            <TextField
              select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value as AccountType | '')
                setPage(0)
              }}
              label={t('coa.filters.type')}
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
            >
              <MenuItem value="">{t('coa.filters.allStatuses')}</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>{t(`coa.statuses.${status}`)}</MenuItem>
              ))}
            </TextField>
          </>
        )}
      />

      {accountsQuery.isError && (
        <Alert severity="error">
          {toAppApiError(accountsQuery.error).message}
        </Alert>
      )}

      <EntityTable
        rows={accounts}
        columns={columns}
        getRowKey={(account) => account.id}
        loading={accountsQuery.isLoading}
        emptyIcon={<AccountTreeOutlined />}
        emptyTitle={t('coa.empty')}
        pagination={{
          page,
          rowsPerPage: perPage,
          count: meta?.total ?? 0,
          onPageChange: setPage,
          onRowsPerPageChange: (nextPerPage) => {
            setPerPage(nextPerPage)
            setPage(0)
          },
        }}
        rowActions={(account) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canManage && !account.is_system}
            showDelete={canManage && !account.is_system}
            deleteDisabled={deleteAccount.isPending}
            onEdit={() => openEditForm(account)}
            onDelete={() => setDeletingAccount(account)}
          />
        )}
      />

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
