'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import { Inventory2Outlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
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

const rowsPerPageOptions = [10, 25, 50]
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

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Inventory2Outlined color="primary" />
          <Typography variant="h4">{t('lots.title')}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
          {t('lots.subtitle')}
        </Typography>
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
              placeholder={t('lots.filters.search')}
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
            <SearchableFilterSelect
              value={warehouseFilter}
              options={warehouses}
              loading={optionsQuery.isLoading}
              label={t('lots.filters.warehouse')}
              placeholder={t('lots.filters.allWarehouses')}
              getOptionValue={(warehouse) => warehouse.id}
              getOptionLabel={(warehouse) => warehouse.name}
              getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')}
              onChange={(value) => {
                setWarehouseFilter(value)
                setPage(0)
              }}
              sx={{ minWidth: { xs: '100%', lg: 240 } }}
            />
            <TextField
              select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(0)
              }}
              label={t('lots.filters.status')}
              sx={{ minWidth: { xs: '100%', lg: 190 } }}
            >
              <MenuItem value="">{t('lots.filters.allStatuses')}</MenuItem>
              {lotStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {t(`lots.status.${status}`)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {lotsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(lotsQuery.error).message}
            </Alert>
          )}

          {optionsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(optionsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('lots.columns.lotNumber')}</TableCell>
                  <TableCell>{t('lots.columns.product')}</TableCell>
                  <TableCell>{t('lots.columns.warehouse')}</TableCell>
                  <TableCell>{t('lots.columns.status')}</TableCell>
                  <TableCell align="right">{t('lots.columns.onHand')}</TableCell>
                  <TableCell align="right">{t('lots.columns.reserved')}</TableCell>
                  <TableCell>{t('lots.columns.expiryDate')}</TableCell>
                  <TableCell>{t('lots.columns.receivedAt')}</TableCell>
                  <TableCell align="right">{t('lots.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lotsQuery.isLoading && <TableStateRow colSpan={9} loading />}

                {!lotsQuery.isLoading && lots.length === 0 && (
                  <TableStateRow colSpan={9} message={t('lots.empty')} />
                )}

                {lots.map((lot) => (
                  <TableRow key={lot.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{lot.lot_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{productLabel(lot)}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {lot.variation?.sku ?? lot.product?.sku ?? '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{lot.warehouse?.name ?? '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {lot.warehouse?.branch_name ?? '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`lots.status.${lot.status}`)}
                        color={statusColor(lot.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{formatQuantity(lot.qty_on_hand)}</TableCell>
                    <TableCell align="right">{formatQuantity(lot.qty_reserved)}</TableCell>
                    <TableCell>{formatAppDate(lot.expiry_date, dateFormat, i18n.language)}</TableCell>
                    <TableCell>{formatAppDateTime(lot.received_at, dateFormat, i18n.language)}</TableCell>
                    <TableCell align="right">
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
