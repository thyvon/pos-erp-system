'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Add, CheckCircleOutlined, CompareArrowsOutlined } from '@/components/ui/icons'
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
import {
  useDeleteStockTransferMutation,
  useInventoryOptionsQuery,
  useReceiveStockTransferMutation,
  useStockTransfersQuery,
} from '@/features/inventory/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import type { StockTransfer, StockTransferFilters, StockTransferStatus } from '@/types/inventory'

function statusColor(status: StockTransferStatus) {
  if (status === 'received') return 'success'
  if (status === 'in_transit') return 'info'
  return 'warning'
}

export default function StockTransfersPage() {
  const { t, i18n } = useTranslation(['inventory', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const router = useRouter()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [directionFilter, setDirectionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [deletingTransfer, setDeletingTransfer] = useState<StockTransfer | null>(null)
  const [receivingTransfer, setReceivingTransfer] = useState<StockTransfer | null>(null)

  const filters: StockTransferFilters = useMemo(
    () => ({
      search: search || undefined,
      warehouse_id: warehouseFilter || undefined,
      direction: directionFilter ? (directionFilter as 'in' | 'out') : undefined,
      status: statusFilter ? (statusFilter as StockTransferStatus) : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [dateFrom, dateTo, directionFilter, page, perPage, search, statusFilter, warehouseFilter]
  )

  const optionsQuery = useInventoryOptionsQuery()
  const transfersQuery = useStockTransfersQuery(filters)
  const deleteTransfer = useDeleteStockTransferMutation()
  const receiveTransfer = useReceiveStockTransferMutation()

  const transfers = transfersQuery.data?.data ?? []
  const warehouses = optionsQuery.data?.warehouses ?? []
  const meta = transfersQuery.data?.meta
  const canTransfer = can('inventory.transfer')
  const dateFormat = useAppDateFormat()

  const confirmDelete = async () => {
    if (!deletingTransfer) return

    await deleteTransfer.mutateAsync(deletingTransfer.id)
    enqueueSnackbar(t('transfers.messages.deleted'), { variant: 'success' })
    setDeletingTransfer(null)
  }

  const confirmReceive = async () => {
    if (!receivingTransfer) return

    await receiveTransfer.mutateAsync(receivingTransfer.id)
    enqueueSnackbar(t('transfers.messages.received'), { variant: 'success' })
    setReceivingTransfer(null)
  }

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(0)
  }, [])

  const handleWarehouseChange = useCallback((value: string) => {
    setWarehouseFilter(value)
    setPage(0)
  }, [])

  const handleDirectionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDirectionFilter(event.target.value)
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
    setDirectionFilter('')
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
    if (directionFilter) {
      chips.push({
        key: 'direction',
        label: t(`transfers.directions.${directionFilter}`),
        onDelete: () => { setDirectionFilter(''); setPage(0) },
      })
    }
    if (statusFilter) {
      chips.push({
        key: 'status',
        label: t(`transfers.status.${statusFilter}`),
        onDelete: () => { setStatusFilter(''); setPage(0) },
      })
    }
    if (dateFrom) {
      chips.push({
        key: 'dateFrom',
        label: `${t('transfers.filters.dateFrom')}: ${dateFrom}`,
        onDelete: () => { setDateFrom(''); setPage(0) },
      })
    }
    if (dateTo) {
      chips.push({
        key: 'dateTo',
        label: `${t('transfers.filters.dateTo')}: ${dateTo}`,
        onDelete: () => { setDateTo(''); setPage(0) },
      })
    }
    return chips
  }, [warehouseFilter, directionFilter, statusFilter, dateFrom, dateTo, selectedWarehouse, t])

  const columns: EntityTableColumn<StockTransfer>[] = useMemo(() => [
    {
      key: 'reference',
      label: t('transfers.columns.reference'),
      render: (transfer) => (
        <Typography variant="subtitle2">{transfer.reference_no}</Typography>
      ),
    },
    {
      key: 'date',
      label: t('transfers.columns.date'),
      render: (transfer) => <>{formatAppDate(transfer.date, dateFormat, i18n.language)}</>,
    },
    {
      key: 'fromWarehouse',
      label: t('transfers.columns.fromWarehouse'),
      render: (transfer) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{transfer.from_warehouse?.name ?? '-'}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {transfer.from_warehouse?.branch_name ?? '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'toWarehouse',
      label: t('transfers.columns.toWarehouse'),
      render: (transfer) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{transfer.to_warehouse?.name ?? '-'}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {transfer.to_warehouse?.branch_name ?? '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'status',
      label: t('transfers.columns.status'),
      render: (transfer) => (
        <Chip
          size="small"
          label={t(`transfers.status.${transfer.status}`)}
          color={statusColor(transfer.status)}
          variant="outlined"
        />
      ),
    },
    {
      key: 'items',
      label: t('transfers.columns.items'),
      render: (transfer) => <>{transfer.items?.length ?? 0}</>,
    },
    {
      key: 'createdBy',
      label: t('transfers.columns.createdBy'),
      render: (transfer) => <>{transfer.creator?.name || '-'}</>,
    },
  ], [t, dateFormat, i18n.language])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<CompareArrowsOutlined color="primary" />}
        title={t('transfers.title')}
        description={t('transfers.subtitle')}
        actions={canTransfer && (
          <Button startIcon={<Add />} variant="contained" onClick={() => router.push('/inventory/transfers/create')}>
            {t('transfers.actions.new')}
          </Button>
        )}
      />

      {(transfersQuery.isError || optionsQuery.isError) && (
        <Stack spacing={1}>
          {transfersQuery.isError && (
            <Alert severity="error">{toAppApiError(transfersQuery.error).message}</Alert>
          )}
          {optionsQuery.isError && (
            <Alert severity="error">{toAppApiError(optionsQuery.error).message}</Alert>
          )}
        </Stack>
      )}

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('transfers.filters.search')}
        onSearchChange={handleSearchChange}
        activeFilters={activeFilters}
        onClearFilters={clearFilters}
        filterButtonLabel={t('transfers.filters.status')}
        filters={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <SearchableFilterSelect
              value={warehouseFilter}
              options={warehouses}
              loading={optionsQuery.isLoading}
              label={t('transfers.filters.warehouse')}
              placeholder={t('transfers.filters.allWarehouses')}
              getOptionValue={(warehouse) => warehouse.id}
              getOptionLabel={(warehouse) => warehouse.name}
              getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')}
              onChange={handleWarehouseChange}
            />
            <TextField
              select
              value={directionFilter}
              onChange={handleDirectionChange}
              label={t('transfers.filters.direction')}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">{t('transfers.filters.anyDirection')}</MenuItem>
              <MenuItem value="out">{t('transfers.directions.out')}</MenuItem>
              <MenuItem value="in">{t('transfers.directions.in')}</MenuItem>
            </TextField>
            <TextField
              select
              value={statusFilter}
              onChange={handleStatusChange}
              label={t('transfers.filters.status')}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="">{t('transfers.filters.allStatuses')}</MenuItem>
              <MenuItem value="pending">{t('transfers.status.pending')}</MenuItem>
              <MenuItem value="in_transit">{t('transfers.status.in_transit')}</MenuItem>
              <MenuItem value="received">{t('transfers.status.received')}</MenuItem>
            </TextField>
            <AppDatePicker
              value={dateFrom}
              onChange={handleDateFromChange}
              label={t('transfers.filters.dateFrom')}
            />
            <AppDatePicker
              value={dateTo}
              onChange={handleDateToChange}
              label={t('transfers.filters.dateTo')}
            />
          </Stack>
        }
      />

      <EntityTable
        rows={transfers}
        columns={columns}
        getRowKey={(transfer) => transfer.id}
        loading={transfersQuery.isLoading}
        emptyIcon={<CompareArrowsOutlined />}
        emptyTitle={t('transfers.empty')}
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
        rowActions={(transfer) => (
          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
            <RowActions
              viewLabel={t('transfers.actions.view')}
              editLabel={t('common:buttons.edit')}
              deleteLabel={t('common:buttons.delete')}
              showView
              showEdit={canTransfer && transfer.status !== 'received'}
              showDelete={canTransfer && transfer.status !== 'received'}
              onView={() => router.push(`/inventory/transfers/${transfer.id}`)}
              onEdit={() => router.push(`/inventory/transfers/${transfer.id}/edit`)}
              onDelete={() => setDeletingTransfer(transfer)}
            />
            {canTransfer && transfer.status === 'in_transit' && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircleOutlined />}
                onClick={() => setReceivingTransfer(transfer)}
              >
                {t('transfers.actions.receive')}
              </Button>
            )}
          </Stack>
        )}
      />

      <ConfirmDialog
        open={!!deletingTransfer}
        title={t('transfers.confirmDelete.title')}
        message={t('transfers.confirmDelete.message', { reference: deletingTransfer?.reference_no ?? '' })}
        confirmText={t('common:buttons.delete')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteTransfer.isPending}
        confirmColor="error"
        onClose={() => setDeletingTransfer(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={!!receivingTransfer}
        title={t('transfers.confirmReceive.title')}
        message={t('transfers.confirmReceive.message', { reference: receivingTransfer?.reference_no ?? '' })}
        confirmText={t('transfers.actions.receive')}
        cancelText={t('common:buttons.cancel')}
        loading={receiveTransfer.isPending}
        confirmColor="success"
        onClose={() => setReceivingTransfer(null)}
        onConfirm={confirmReceive}
      />
    </Stack>
  )
}
