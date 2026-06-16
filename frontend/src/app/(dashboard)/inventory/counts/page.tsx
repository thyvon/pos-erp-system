'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Add, FactCheckOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { useDeleteStockCountMutation, useInventoryOptionsQuery, useStockCountsQuery } from '@/features/inventory/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import type { StockCount, StockCountFilters, StockCountStatus } from '@/types/inventory'

function statusColor(status: StockCountStatus) {
  return status === 'completed' ? 'success' : 'warning'
}

export default function StockCountsPage() {
  const { t, i18n } = useTranslation(['inventory', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [deletingCount, setDeletingCount] = useState<StockCount | null>(null)

  const filters: StockCountFilters = useMemo(
    () => ({
      search: search || undefined,
      warehouse_id: warehouseFilter || undefined,
      status: statusFilter ? (statusFilter as StockCountStatus) : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [dateFrom, dateTo, page, perPage, search, statusFilter, warehouseFilter]
  )

  const optionsQuery = useInventoryOptionsQuery()
  const countsQuery = useStockCountsQuery(filters)
  const deleteCount = useDeleteStockCountMutation()
  const counts = countsQuery.data?.data ?? []
  const warehouses = optionsQuery.data?.warehouses ?? []
  const meta = countsQuery.data?.meta
  const canCount = can('inventory.count')
  const dateFormat = useAppDateFormat()

  const confirmDelete = async () => {
    if (!deletingCount) return

    await deleteCount.mutateAsync(deletingCount.id)
    enqueueSnackbar(t('counts.messages.deleted'), { variant: 'success' })
    setDeletingCount(null)
  }

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(0)
  }, [])

  const handleWarehouseChange = useCallback((value: string) => {
    setWarehouseFilter(value)
    setPage(0)
  }, [])

  const handleStatusChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setStatusFilter(event.target.value)
    setPage(0)
  }, [])

  const handleDateFromChange = useCallback((value: string | null) => {
    setDateFrom(value ?? '')
    setPage(0)
  }, [])

  const handleDateToChange = useCallback((value: string | null) => {
    setDateTo(value ?? '')
    setPage(0)
  }, [])

  const clearFilters = useCallback(() => {
    setWarehouseFilter('')
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(0)
  }, [])

  const selectedWarehouse = warehouses.find((w) => w.id === warehouseFilter)

  const activeFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; onDelete: () => void }> = []
    if (warehouseFilter && selectedWarehouse) {
      chips.push({
        key: 'warehouse',
        label: selectedWarehouse.name,
        onDelete: () => { setWarehouseFilter(''); setPage(0) },
      })
    }
    if (statusFilter) {
      chips.push({
        key: 'status',
        label: t(`counts.status.${statusFilter}`),
        onDelete: () => { setStatusFilter(''); setPage(0) },
      })
    }
    if (dateFrom) {
      chips.push({
        key: 'dateFrom',
        label: `${t('counts.filters.dateFrom')}: ${dateFrom}`,
        onDelete: () => { setDateFrom(''); setPage(0) },
      })
    }
    if (dateTo) {
      chips.push({
        key: 'dateTo',
        label: `${t('counts.filters.dateTo')}: ${dateTo}`,
        onDelete: () => { setDateTo(''); setPage(0) },
      })
    }
    return chips
  }, [warehouseFilter, statusFilter, dateFrom, dateTo, selectedWarehouse, t])

  const columns: EntityTableColumn<StockCount>[] = useMemo(() => [
    {
      key: 'reference',
      label: t('counts.columns.reference'),
      render: (count) => (
        <Typography variant="subtitle2">{count.reference_no}</Typography>
      ),
    },
    {
      key: 'date',
      label: t('counts.columns.date'),
      render: (count) => <>{formatAppDate(count.date, dateFormat, i18n.language)}</>,
    },
    {
      key: 'warehouse',
      label: t('counts.columns.warehouse'),
      render: (count) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{count.warehouse?.name ?? '-'}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {count.warehouse?.branch_name ?? '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'status',
      label: t('counts.columns.status'),
      render: (count) => (
        <Chip
          size="small"
          label={t(`counts.status.${count.status}`)}
          color={statusColor(count.status)}
          variant="outlined"
        />
      ),
    },
    {
      key: 'discrepancies',
      label: t('counts.columns.discrepancies'),
      align: 'right',
      render: (count) => <>{count.discrepancy_count}</>,
    },
    {
      key: 'createdBy',
      label: t('counts.columns.createdBy'),
      render: (count) => <>{count.creator?.name || '-'}</>,
    },
    {
      key: 'completedBy',
      label: t('counts.columns.completedBy'),
      render: (count) => <>{count.completer?.name || '-'}</>,
    },
  ], [t, dateFormat, i18n.language])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<FactCheckOutlined color="primary" />}
        title={t('counts.title')}
        description={t('counts.subtitle')}
        actions={canCount && (
          <Button startIcon={<Add />} variant="contained" onClick={() => router.push('/inventory/counts/create')}>
            {t('counts.actions.new')}
          </Button>
        )}
      />

      {(countsQuery.isError || optionsQuery.isError) && (
        <Stack spacing={1}>
          {countsQuery.isError && (
            <Alert severity="error">{toAppApiError(countsQuery.error).message}</Alert>
          )}
          {optionsQuery.isError && (
            <Alert severity="error">{toAppApiError(optionsQuery.error).message}</Alert>
          )}
        </Stack>
      )}

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('counts.filters.search')}
        onSearchChange={handleSearchChange}
        activeFilters={activeFilters}
        onClearFilters={clearFilters}
        filterButtonLabel={t('counts.filters.status')}
        filters={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <SearchableFilterSelect
              value={warehouseFilter}
              options={warehouses}
              loading={optionsQuery.isLoading}
              label={t('counts.filters.warehouse')}
              placeholder={t('counts.filters.allWarehouses')}
              getOptionValue={(warehouse) => warehouse.id}
              getOptionLabel={(warehouse) => warehouse.name}
              getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')}
              onChange={handleWarehouseChange}
            />
            <TextField
              select
              value={statusFilter}
              onChange={handleStatusChange}
              label={t('counts.filters.status')}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="">{t('counts.filters.allStatuses')}</MenuItem>
              <MenuItem value="in_progress">{t('counts.status.in_progress')}</MenuItem>
              <MenuItem value="completed">{t('counts.status.completed')}</MenuItem>
            </TextField>
            <AppDatePicker
              value={dateFrom}
              onChange={handleDateFromChange}
              label={t('counts.filters.dateFrom')}
            />
            <AppDatePicker
              value={dateTo}
              onChange={handleDateToChange}
              label={t('counts.filters.dateTo')}
            />
          </Stack>
        }
      />

      <EntityTable
        rows={counts}
        columns={columns}
        getRowKey={(count) => count.id}
        loading={countsQuery.isLoading}
        emptyIcon={<FactCheckOutlined />}
        emptyTitle={t('counts.empty')}
        emptyDescription=""
        pagination={{
          page,
          rowsPerPage: perPage,
          count: meta?.total ?? 0,
          onPageChange: (newPage) => setPage(newPage),
          onRowsPerPageChange: (newRowsPerPage) => {
            setPerPage(newRowsPerPage)
            setPage(0)
          },
        }}
        rowActions={(count) => (
          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
            <RowActions
              viewLabel={t('counts.actions.view')}
              editLabel={t('common:buttons.edit')}
              deleteLabel={t('common:buttons.delete')}
              showView
              showEdit={false}
              showDelete={canCount && count.status === 'in_progress'}
              onView={() => router.push(`/inventory/counts/${count.id}`)}
              onDelete={() => setDeletingCount(count)}
            />
            {canCount && count.status === 'in_progress' && (
              <Tooltip title={t('counts.actions.openEntryForm')}>
                <IconButton
                  size="small"
                  color="primary"
                  aria-label={t('counts.actions.openEntryForm')}
                  onClick={() => router.push(`/inventory/counts/${count.id}/entries`)}
                >
                  <Add fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        )}
      />

      <ConfirmDialog
        open={!!deletingCount}
        title={t('counts.confirmDelete.title')}
        message={t('counts.confirmDelete.message', { reference: deletingCount?.reference_no ?? '' })}
        confirmText={t('common:buttons.delete')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteCount.isPending}
        confirmColor="error"
        onClose={() => setDeletingCount(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  )
}
