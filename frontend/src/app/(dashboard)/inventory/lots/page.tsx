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
  useStockLotQuery,
  useStockLotsQuery,
  useUpdateStockLotStatusMutation,
} from '@/features/inventory/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import type { StockLot, StockLotFilters, StockLotStatus } from '@/types/inventory'

const lotStatuses: StockLotStatus[] = ['active', 'depleted', 'expired', 'recalled', 'quarantine']

function statusColor(status: StockLotStatus) {
  if (status === 'active') return 'success'
  if (status === 'quarantine') return 'warning'
  if (status === 'depleted') return 'default'
  return 'error'
}

function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(value)
}

function productLabel(lot: StockLot) {
  return [
    lot.product?.name,
    lot.variation?.name,
  ].filter(Boolean).join(' / ') || '-'
}

export default function StockLotsPage() {
  const { t, i18n } = useTranslation(['inventory', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [viewingLot, setViewingLot] = useState<StockLot | null>(null)
  const [statusLot, setStatusLot] = useState<StockLot | null>(null)
  const [statusDraft, setStatusDraft] = useState<StockLotStatus>('active')
  const [reason, setReason] = useState('')

  const filters: StockLotFilters = useMemo(
    () => ({
      search: search || undefined,
      warehouse_id: warehouseFilter || undefined,
      status: statusFilter ? (statusFilter as StockLotStatus) : undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, statusFilter, warehouseFilter]
  )

  const optionsQuery = useInventoryOptionsQuery()
  const lotsQuery = useStockLotsQuery(filters)
  const detailQuery = useStockLotQuery(viewingLot?.id ?? null)
  const updateStatus = useUpdateStockLotStatusMutation()
  const dateFormat = useAppDateFormat()
  const lots = lotsQuery.data?.data ?? []
  const warehouses = optionsQuery.data?.warehouses ?? []
  const meta = lotsQuery.data?.meta
  const selectedLot = detailQuery.data ?? viewingLot
  const canAdjust = can('inventory.adjust')

  const openStatusDialog = (lot: StockLot) => {
    setStatusLot(lot)
    setStatusDraft(lot.status)
    setReason('')
  }

  const confirmStatusUpdate = async () => {
    if (!statusLot) return

    await updateStatus.mutateAsync({
      id: statusLot.id,
      payload: {
        status: statusDraft,
        reason: reason.trim() || null,
      },
    })
    enqueueSnackbar(t('lots.messages.statusUpdated'), { variant: 'success' })
    setStatusLot(null)
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
        label: t(`lots.status.${statusFilter}`),
        onDelete: () => { setStatusFilter(''); setPage(0) },
      })
    }
    return chips
  }, [warehouseFilter, statusFilter, selectedWarehouse, t])

  const columns: EntityTableColumn<StockLot>[] = useMemo(() => [
    {
      key: 'lot_number',
      label: t('lots.columns.lotNumber'),
      render: (lot) => (
        <Typography variant="subtitle2">{lot.lot_number}</Typography>
      ),
    },
    {
      key: 'product',
      label: t('lots.columns.product'),
      render: (lot) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{productLabel(lot)}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {lot.variation?.sku ?? lot.product?.sku ?? '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'warehouse',
      label: t('lots.columns.warehouse'),
      render: (lot) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{lot.warehouse?.name ?? '-'}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {lot.warehouse?.branch_name ?? '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'status',
      label: t('lots.columns.status'),
      render: (lot) => (
        <Chip
          size="small"
          label={t(`lots.status.${lot.status}`)}
          color={statusColor(lot.status)}
          variant="outlined"
        />
      ),
    },
    {
      key: 'qty_on_hand',
      label: t('lots.columns.onHand'),
      align: 'right',
      render: (lot) => <>{formatQuantity(lot.qty_on_hand)}</>,
    },
    {
      key: 'qty_reserved',
      label: t('lots.columns.reserved'),
      align: 'right',
      render: (lot) => <>{formatQuantity(lot.qty_reserved)}</>,
    },
    {
      key: 'expiry_date',
      label: t('lots.columns.expiryDate'),
      render: (lot) => <>{formatAppDate(lot.expiry_date, dateFormat, i18n.language)}</>,
    },
    {
      key: 'received_at',
      label: t('lots.columns.receivedAt'),
      render: (lot) => <>{formatAppDateTime(lot.received_at, dateFormat, i18n.language)}</>,
    },
  ], [t, dateFormat, i18n.language])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        eyebrow="Inventory"
        title={t('lots.title')}
        description={t('lots.subtitle')}
      />

      {(lotsQuery.isError || optionsQuery.isError) && (
        <Stack spacing={1}>
          {lotsQuery.isError && (
            <Alert severity="error">{toAppApiError(lotsQuery.error).message}</Alert>
          )}
          {optionsQuery.isError && (
            <Alert severity="error">{toAppApiError(optionsQuery.error).message}</Alert>
          )}
        </Stack>
      )}

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('lots.filters.search')}
        onSearchChange={handleSearchChange}
        activeFilters={activeFilters}
        onClearFilters={clearFilters}
        filterButtonLabel={t('lots.filters.status')}
        defaultFiltersOpen={false}
        filters={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <SearchableFilterSelect
              value={warehouseFilter}
              options={warehouses}
              loading={optionsQuery.isLoading}
              label={t('lots.filters.warehouse')}
              placeholder={t('lots.filters.allWarehouses')}
              getOptionValue={(warehouse) => warehouse.id}
              getOptionLabel={(warehouse) => warehouse.name}
              getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')}
              onChange={handleWarehouseChange}
            />
            <TextField
              select
              value={statusFilter}
              onChange={handleStatusChange}
              label={t('lots.filters.status')}
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="">{t('lots.filters.allStatuses')}</MenuItem>
              {lotStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {t(`lots.status.${status}`)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
      />

      <EntityTable
        rows={lots}
        columns={columns}
        getRowKey={(lot) => lot.id}
        loading={lotsQuery.isLoading}
        emptyIcon={<Inventory2Outlined />}
        emptyTitle={t('lots.empty')}
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
        rowActions={(lot) => (
          <RowActions
            viewLabel={t('lots.actions.view')}
            editLabel={t('lots.actions.updateStatus')}
            deleteLabel={t('common:buttons.delete')}
            showView
            showEdit={canAdjust}
            showDelete={false}
            onView={() => setViewingLot(lot)}
            onEdit={() => openStatusDialog(lot)}
          />
        )}
      />

      <Dialog open={!!viewingLot} onClose={() => setViewingLot(null)} fullWidth maxWidth="md">
        <DialogTitle>{selectedLot?.lot_number ?? t('lots.detail.title')}</DialogTitle>
        <DialogContent dividers>
          {detailQuery.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}
          {detailQuery.isError && (
            <Alert severity="error">{toAppApiError(detailQuery.error).message}</Alert>
          )}
          {selectedLot && !detailQuery.isLoading && (
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
                    {t('lots.columns.product')}
                  </Typography>
                  <Typography variant="body2">{productLabel(selectedLot)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('lots.columns.warehouse')}
                  </Typography>
                  <Typography variant="body2">{selectedLot.warehouse?.name ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('lots.columns.supplier')}
                  </Typography>
                  <Typography variant="body2">{selectedLot.supplier?.name ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('lots.columns.received')}
                  </Typography>
                  <Typography variant="body2">{formatQuantity(selectedLot.qty_received)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('lots.columns.available')}
                  </Typography>
                  <Typography variant="body2">{formatQuantity(selectedLot.qty_available)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('lots.columns.unitCost')}
                  </Typography>
                  <Typography variant="body2">{formatQuantity(selectedLot.unit_cost)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('lots.columns.manufactureDate')}
                  </Typography>
                  <Typography variant="body2">
                    {formatAppDate(selectedLot.manufacture_date, dateFormat, i18n.language)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('lots.columns.expiryDate')}
                  </Typography>
                  <Typography variant="body2">{formatAppDate(selectedLot.expiry_date, dateFormat, i18n.language)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('lots.columns.status')}
                  </Typography>
                  <Typography variant="body2">{t(`lots.status.${selectedLot.status}`)}</Typography>
                </Box>
              </Box>
              {selectedLot.notes && (
                <>
                  <Divider />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {selectedLot.notes}
                  </Typography>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!statusLot} onClose={() => setStatusLot(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('lots.dialogs.statusTitle')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {updateStatus.isError && (
              <Alert severity="error">{toAppApiError(updateStatus.error).message}</Alert>
            )}
            <TextField
              select
              value={statusDraft}
              onChange={(event) => setStatusDraft(event.target.value as StockLotStatus)}
              label={t('lots.filters.status')}
              fullWidth
            >
              {lotStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {t(`lots.status.${status}`)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              label={t('lots.fields.reason')}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setStatusLot(null)} disabled={updateStatus.isPending}>
            {t('common:buttons.cancel')}
          </Button>
          <Button variant="contained" onClick={confirmStatusUpdate} disabled={updateStatus.isPending}>
            {updateStatus.isPending ? <CircularProgress size={20} color="inherit" /> : t('lots.actions.updateStatus')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
