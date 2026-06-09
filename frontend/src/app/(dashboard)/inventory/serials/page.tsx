'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Inventory2Outlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable from '@/components/common/EntityTable'
import type { EntityTableColumn } from '@/components/common/EntityTable'
import {
  useInventoryOptionsQuery,
  useStockSerialQuery,
  useStockSerialsQuery,
  useWriteOffStockSerialMutation,
} from '@/features/inventory/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import type { StockSerial, StockSerialFilters, StockSerialStatus } from '@/types/inventory'

const serialStatuses: StockSerialStatus[] = ['in_stock', 'reserved', 'sold', 'returned', 'transferred', 'written_off']

function statusColor(status: StockSerialStatus) {
  if (status === 'in_stock') return 'success'
  if (status === 'reserved' || status === 'transferred') return 'info'
  if (status === 'returned') return 'warning'
  if (status === 'written_off') return 'error'
  return 'default'
}

function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(value)
}

function productLabel(serial: StockSerial) {
  return [
    serial.product?.name,
    serial.variation?.name,
  ].filter(Boolean).join(' / ') || '-'
}

function canWriteOffSerial(serial: StockSerial, canAdjust: boolean) {
  return canAdjust && !!serial.warehouse_id && serial.status !== 'sold' && serial.status !== 'written_off'
}

export default function StockSerialsPage() {
  const { t, i18n } = useTranslation(['inventory', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [viewingSerial, setViewingSerial] = useState<StockSerial | null>(null)
  const [writeOffSerial, setWriteOffSerial] = useState<StockSerial | null>(null)
  const [reason, setReason] = useState('')

  const filters: StockSerialFilters = useMemo(
    () => ({
      search: search || undefined,
      warehouse_id: warehouseFilter || undefined,
      status: statusFilter ? (statusFilter as StockSerialStatus) : undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, statusFilter, warehouseFilter]
  )

  const optionsQuery = useInventoryOptionsQuery()
  const serialsQuery = useStockSerialsQuery(filters)
  const detailQuery = useStockSerialQuery(viewingSerial?.id ?? null)
  const writeOff = useWriteOffStockSerialMutation()
  const dateFormat = useAppDateFormat()
  const serials = serialsQuery.data?.data ?? []
  const warehouses = optionsQuery.data?.warehouses ?? []
  const meta = serialsQuery.data?.meta
  const selectedSerial = detailQuery.data ?? viewingSerial
  const canAdjust = can('inventory.adjust')

  const openWriteOffDialog = (serial: StockSerial) => {
    setWriteOffSerial(serial)
    setReason('')
  }

  const confirmWriteOff = async () => {
    if (!writeOffSerial || !reason.trim()) return

    await writeOff.mutateAsync({
      id: writeOffSerial.id,
      payload: { reason: reason.trim() },
    })
    enqueueSnackbar(t('serials.messages.writtenOff'), { variant: 'success' })
    setWriteOffSerial(null)
    setReason('')
  }

  const clearFilters = useCallback(() => {
    setWarehouseFilter('')
    setStatusFilter('')
    setPage(0)
  }, [])

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
        label: t(`serials.status.${statusFilter}`),
        onDelete: () => { setStatusFilter(''); setPage(0) },
      })
    }
    return chips
  }, [warehouseFilter, statusFilter, selectedWarehouse, t])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setPerPage(newRowsPerPage)
    setPage(0)
  }, [])

  const columns: EntityTableColumn<StockSerial>[] = useMemo(() => [
    {
      key: 'serial_number',
      label: t('serials.columns.serialNumber'),
      render: (serial) => (
        <Typography variant="subtitle2">{serial.serial_number}</Typography>
      ),
    },
    {
      key: 'product',
      label: t('serials.columns.product'),
      render: (serial) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{productLabel(serial)}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {serial.variation?.sku ?? serial.product?.sku ?? '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'warehouse',
      label: t('serials.columns.warehouse'),
      render: (serial) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{serial.warehouse?.name ?? '-'}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {serial.warehouse?.branch_name ?? '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'reference',
      label: t('serials.columns.reference'),
      render: (serial) => (
        <Stack spacing={0.25}>
          {serial.purchase_reference && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {serial.purchase_reference}
            </Typography>
          )}
          {serial.sale_reference && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {serial.sale_reference}
            </Typography>
          )}
          {!serial.purchase_reference && !serial.sale_reference && (
            <Typography variant="body2">-</Typography>
          )}
        </Stack>
      ),
    },
    {
      key: 'status',
      label: t('serials.columns.status'),
      render: (serial) => (
        <Chip
          size="small"
          label={t(`serials.status.${serial.status}`)}
          color={statusColor(serial.status)}
          variant="outlined"
        />
      ),
    },
    {
      key: 'unit_cost',
      label: t('serials.columns.unitCost'),
      align: 'right',
      render: (serial) => <>{formatQuantity(serial.unit_cost)}</>,
    },
    {
      key: 'warranty_expires',
      label: t('serials.columns.warrantyExpires'),
      render: (serial) => <>{formatAppDate(serial.warranty_expires, dateFormat, i18n.language)}</>,
    },
    {
      key: 'received_at',
      label: t('serials.columns.receivedAt'),
      render: (serial) => <>{formatAppDateTime(serial.received_at, dateFormat, i18n.language)}</>,
    },
    {
      key: 'sold_at',
      label: t('serials.columns.soldAt'),
      render: (serial) => <>{formatAppDateTime(serial.sold_at, dateFormat, i18n.language)}</>,
    },
  ], [t, dateFormat, i18n.language])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        eyebrow="Inventory"
        title={t('serials.title')}
        description={t('serials.subtitle')}
      />

      {(serialsQuery.isError || optionsQuery.isError) && (
        <Stack spacing={1}>
          {serialsQuery.isError && (
            <Alert severity="error">{toAppApiError(serialsQuery.error).message}</Alert>
          )}
          {optionsQuery.isError && (
            <Alert severity="error">{toAppApiError(optionsQuery.error).message}</Alert>
          )}
        </Stack>
      )}

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('serials.filters.search')}
        onSearchChange={handleSearchChange}
        activeFilters={activeFilters}
        onClearFilters={clearFilters}
        filterButtonLabel={t('serials.filters.status')}
        defaultFiltersOpen={false}
        filters={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <SearchableFilterSelect
              value={warehouseFilter}
              options={warehouses}
              loading={optionsQuery.isLoading}
              label={t('serials.filters.warehouse')}
              placeholder={t('serials.filters.allWarehouses')}
              getOptionValue={(warehouse) => warehouse.id}
              getOptionLabel={(warehouse) => warehouse.name}
              getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')}
              onChange={handleWarehouseChange}
            />
            <TextField
              select
              value={statusFilter}
              onChange={handleStatusChange}
              label={t('serials.filters.status')}
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="">{t('serials.filters.allStatuses')}</MenuItem>
              {serialStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {t(`serials.status.${status}`)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
      />

      <EntityTable
        rows={serials}
        columns={columns}
        getRowKey={(serial) => serial.id}
        loading={serialsQuery.isLoading}
        emptyIcon={<Inventory2Outlined />}
        emptyTitle={t('serials.empty')}
        emptyDescription=""
        pagination={{
          page,
          rowsPerPage: perPage,
          count: meta?.total ?? 0,
          onPageChange: handlePageChange,
          onRowsPerPageChange: handleRowsPerPageChange,
        }}
        rowActions={(serial) => (
          <RowActions
            viewLabel={t('serials.actions.view')}
            editLabel={t('serials.actions.writeOff')}
            deleteLabel={t('common:buttons.delete')}
            showView
            showEdit={canWriteOffSerial(serial, canAdjust)}
            showDelete={false}
            onView={() => setViewingSerial(serial)}
            onEdit={() => openWriteOffDialog(serial)}
          />
        )}
      />

      <Dialog open={!!viewingSerial} onClose={() => setViewingSerial(null)} fullWidth maxWidth="md">
        <DialogTitle>{selectedSerial?.serial_number ?? t('serials.detail.title')}</DialogTitle>
        <DialogContent dividers>
          {detailQuery.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}
          {detailQuery.isError && (
            <Alert severity="error">{toAppApiError(detailQuery.error).message}</Alert>
          )}
          {selectedSerial && !detailQuery.isLoading && (
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('serials.columns.product')}
                  </Typography>
                  <Typography variant="body2">{productLabel(selectedSerial)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('serials.columns.warehouse')}
                  </Typography>
                  <Typography variant="body2">{selectedSerial.warehouse?.name ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('serials.columns.supplier')}
                  </Typography>
                  <Typography variant="body2">{selectedSerial.supplier?.name ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('serials.columns.status')}
                  </Typography>
                  <Typography variant="body2">{t(`serials.status.${selectedSerial.status}`)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('serials.columns.unitCost')}
                  </Typography>
                  <Typography variant="body2">{formatQuantity(selectedSerial.unit_cost)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('serials.columns.warrantyExpires')}
                  </Typography>
                  <Typography variant="body2">
                    {formatAppDate(selectedSerial.warranty_expires, dateFormat, i18n.language)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('serials.columns.receivedAt')}
                  </Typography>
                  <Typography variant="body2">
                    {formatAppDateTime(selectedSerial.received_at, dateFormat, i18n.language)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('serials.columns.soldAt')}
                  </Typography>
                  <Typography variant="body2">
                    {formatAppDateTime(selectedSerial.sold_at, dateFormat, i18n.language)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('serials.columns.reference')}
                  </Typography>
                  {selectedSerial.purchase_reference && (
                    <Typography variant="body2">{selectedSerial.purchase_reference}</Typography>
                  )}
                  {selectedSerial.sale_reference && (
                    <Typography variant="body2">{selectedSerial.sale_reference}</Typography>
                  )}
                  {!selectedSerial.purchase_reference && !selectedSerial.sale_reference && (
                    <Typography variant="body2">-</Typography>
                  )}
                </Box>
              </Box>
              {selectedSerial.notes && (
                <>
                  <Divider />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {selectedSerial.notes}
                  </Typography>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!writeOffSerial} onClose={() => setWriteOffSerial(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('serials.dialogs.writeOffTitle')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {writeOff.isError && (
              <Alert severity="error">{toAppApiError(writeOff.error).message}</Alert>
            )}
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('serials.dialogs.writeOffMessage', { serial: writeOffSerial?.serial_number ?? '' })}
            </Typography>
            <TextField
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              label={t('serials.fields.reason')}
              multiline
              minRows={3}
              fullWidth
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setWriteOffSerial(null)} disabled={writeOff.isPending}>
            {t('common:buttons.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmWriteOff}
            disabled={writeOff.isPending || !reason.trim()}
          >
            {writeOff.isPending ? <CircularProgress size={20} color="inherit" /> : t('serials.actions.writeOff')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
