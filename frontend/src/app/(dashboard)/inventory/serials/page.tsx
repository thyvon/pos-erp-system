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
  useStockSerialQuery,
  useStockSerialsQuery,
  useWriteOffStockSerialMutation,
} from '@/features/inventory/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import type { StockSerial, StockSerialFilters, StockSerialStatus } from '@/types/inventory'

const rowsPerPageOptions = [10, 25, 50]
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

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Inventory2Outlined color="primary" />
          <Typography variant="h4">{t('serials.title')}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
          {t('serials.subtitle')}
        </Typography>
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
              placeholder={t('serials.filters.search')}
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
              label={t('serials.filters.warehouse')}
              placeholder={t('serials.filters.allWarehouses')}
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
              label={t('serials.filters.status')}
              sx={{ minWidth: { xs: '100%', lg: 190 } }}
            >
              <MenuItem value="">{t('serials.filters.allStatuses')}</MenuItem>
              {serialStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {t(`serials.status.${status}`)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {serialsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(serialsQuery.error).message}
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
                  <TableCell>{t('serials.columns.serialNumber')}</TableCell>
                  <TableCell>{t('serials.columns.product')}</TableCell>
                  <TableCell>{t('serials.columns.warehouse')}</TableCell>
                  <TableCell>{t('serials.columns.status')}</TableCell>
                  <TableCell align="right">{t('serials.columns.unitCost')}</TableCell>
                  <TableCell>{t('serials.columns.warrantyExpires')}</TableCell>
                  <TableCell>{t('serials.columns.receivedAt')}</TableCell>
                  <TableCell>{t('serials.columns.soldAt')}</TableCell>
                  <TableCell align="center">{t('serials.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serialsQuery.isLoading && <TableStateRow colSpan={9} loading />}

                {!serialsQuery.isLoading && serials.length === 0 && (
                  <TableStateRow colSpan={9} message={t('serials.empty')} />
                )}

                {serials.map((serial) => (
                  <TableRow key={serial.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{serial.serial_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{productLabel(serial)}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {serial.variation?.sku ?? serial.product?.sku ?? '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{serial.warehouse?.name ?? '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {serial.warehouse?.branch_name ?? '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`serials.status.${serial.status}`)}
                        color={statusColor(serial.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{formatQuantity(serial.unit_cost)}</TableCell>
                    <TableCell>{formatAppDate(serial.warranty_expires, dateFormat, i18n.language)}</TableCell>
                    <TableCell>{formatAppDateTime(serial.received_at, dateFormat, i18n.language)}</TableCell>
                    <TableCell>{formatAppDateTime(serial.sold_at, dateFormat, i18n.language)}</TableCell>
                    <TableCell align="center">
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
                    {t('serials.columns.saleItem')}
                  </Typography>
                  <Typography variant="body2">{selectedSerial.sale_item_id ?? '-'}</Typography>
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
