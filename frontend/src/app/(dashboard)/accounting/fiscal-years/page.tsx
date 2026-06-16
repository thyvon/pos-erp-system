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
import { Add, CalculateOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { FiscalYearFormDialog } from '@/features/accounting/FiscalYearFormDialog'
import {
  useCreateFiscalYearMutation,
  useDeleteFiscalYearMutation,
  useFiscalYearsQuery,
  useUpdateFiscalYearMutation,
} from '@/features/accounting/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import type { FiscalYear, FiscalYearFilters, FiscalYearPayload, FiscalYearStatus } from '@/types/accounting'

const statuses: FiscalYearStatus[] = ['active', 'closed']

export default function FiscalYearsPage() {
  const { t, i18n } = useTranslation(['accounting', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FiscalYearStatus | ''>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingFiscalYear, setEditingFiscalYear] = useState<FiscalYear | null>(null)
  const [deletingFiscalYear, setDeletingFiscalYear] = useState<FiscalYear | null>(null)
  const dateFormat = useAppDateFormat()

  const filters: FiscalYearFilters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, statusFilter]
  )

  const fiscalYearsQuery = useFiscalYearsQuery(filters)
  const createFiscalYear = useCreateFiscalYearMutation()
  const updateFiscalYear = useUpdateFiscalYearMutation()
  const deleteFiscalYear = useDeleteFiscalYearMutation()

  const fiscalYears = fiscalYearsQuery.data?.data ?? []
  const summary = fiscalYearsQuery.data?.summary
  const meta = fiscalYearsQuery.data?.meta
  const canManage = can('accounting.index')

  const columns: EntityTableColumn<FiscalYear>[] = useMemo(
    () => [
      {
        key: 'name',
        label: t('fiscalYears.columns.name'),
        render: (year) => <Typography variant="subtitle2">{year.name}</Typography>,
      },
      {
        key: 'period',
        label: t('fiscalYears.columns.period'),
        render: (year) =>
          `${formatAppDate(year.start_date, dateFormat, i18n.language)} - ${formatAppDate(year.end_date, dateFormat, i18n.language)}`,
      },
      {
        key: 'status',
        label: t('fiscalYears.columns.status'),
        render: (year) => (
          <Chip
            size="small"
            label={t(`fiscalYears.statuses.${year.status}`)}
            color={year.status === 'active' ? 'success' : 'default'}
            variant="outlined"
          />
        ),
      },
      {
        key: 'journals',
        label: t('fiscalYears.columns.journals'),
        align: 'right',
        render: (year) => year.journal_count ?? 0,
      },
      {
        key: 'closedAt',
        label: t('fiscalYears.columns.closedAt'),
        render: (year) => formatAppDateTime(year.closed_at, dateFormat, i18n.language),
      },
    ],
    [t, dateFormat, i18n.language]
  )

  const openCreateForm = () => {
    setEditingFiscalYear(null)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: FiscalYearPayload) => {
    if (editingFiscalYear) {
      await updateFiscalYear.mutateAsync({ id: editingFiscalYear.id, payload })
      enqueueSnackbar(t('fiscalYears.messages.updated'), { variant: 'success' })
      return
    }

    await createFiscalYear.mutateAsync(payload)
    enqueueSnackbar(t('fiscalYears.messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingFiscalYear) return

    try {
      await deleteFiscalYear.mutateAsync(deletingFiscalYear.id)
      enqueueSnackbar(t('fiscalYears.messages.deleted'), { variant: 'success' })
      setDeletingFiscalYear(null)
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<CalculateOutlined color="primary" />}
        title={t('fiscalYears.title')}
        description={t('fiscalYears.subtitle')}
        actions={canManage && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('fiscalYears.actions.new')}
          </Button>
        )}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {[
          ['total', summary?.total_years ?? 0],
          ['active', summary?.active_years ?? 0],
          ['closed', summary?.closed_years ?? 0],
        ].map(([key, value]) => (
          <Card key={key}>
            <CardContent>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t(`fiscalYears.summary.${key}`)}
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
        searchPlaceholder={t('fiscalYears.filters.search')}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(0)
        }}
        defaultFiltersOpen
        filters={(
          <TextField
            select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as FiscalYearStatus | '')
              setPage(0)
            }}
            label={t('fiscalYears.filters.status')}
          >
            <MenuItem value="">{t('fiscalYears.filters.allStatuses')}</MenuItem>
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>{t(`fiscalYears.statuses.${status}`)}</MenuItem>
            ))}
          </TextField>
        )}
      />

      {fiscalYearsQuery.isError && (
        <Alert severity="error">
          {toAppApiError(fiscalYearsQuery.error).message}
        </Alert>
      )}

      <EntityTable
        rows={fiscalYears}
        columns={columns}
        getRowKey={(year) => year.id}
        loading={fiscalYearsQuery.isLoading}
        emptyIcon={<CalculateOutlined />}
        emptyTitle={t('fiscalYears.empty')}
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
        rowActions={(year) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canManage}
            showDelete={canManage}
            deleteDisabled={deleteFiscalYear.isPending}
            onEdit={() => {
              setEditingFiscalYear(year)
              setFormOpen(true)
            }}
            onDelete={() => setDeletingFiscalYear(year)}
          />
        )}
      />

      <FiscalYearFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingFiscalYear?.id ?? 'new'}`}
        open={formOpen}
        fiscalYear={editingFiscalYear}
        isSaving={createFiscalYear.isPending || updateFiscalYear.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingFiscalYear}
        title={t('fiscalYears.deleteDialog.title')}
        message={t('fiscalYears.deleteDialog.message', { name: deletingFiscalYear?.name ?? '' })}
        confirmText={t('fiscalYears.deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteFiscalYear.isPending}
        onClose={() => setDeletingFiscalYear(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
