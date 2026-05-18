'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Add, CheckCircleOutlined, CompareArrowsOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import {
  useDeleteStockTransferMutation,
  useInventoryOptionsQuery,
  useReceiveStockTransferMutation,
  useStockTransfersQuery,
} from '@/features/inventory/hooks'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate, getAppDateLocale } from '@/utils/dateFormat'
import type { StockTransfer, StockTransferFilters, StockTransferStatus } from '@/types/inventory'

const rowsPerPageOptions = [10, 25, 50]

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
  const dateLocale = getAppDateLocale(i18n.language)

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

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CompareArrowsOutlined color="primary" />
            <Typography variant="h4">{t('transfers.title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('transfers.subtitle')}
          </Typography>
        </Box>
        {canTransfer && (
          <Button startIcon={<Add />} variant="contained" onClick={() => router.push('/inventory/transfers/create')}>
            {t('transfers.actions.new')}
          </Button>
        )}
      </Stack>

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
              placeholder={t('transfers.filters.search')}
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
              value={warehouseFilter}
              onChange={(event) => {
                setWarehouseFilter(event.target.value)
                setPage(0)
              }}
              label={t('transfers.filters.warehouse')}
              sx={{ minWidth: { xs: '100%', lg: 220 } }}
            >
              <MenuItem value="">{t('transfers.filters.allWarehouses')}</MenuItem>
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                  {warehouse.code ? ` (${warehouse.code})` : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              value={directionFilter}
              onChange={(event) => {
                setDirectionFilter(event.target.value)
                setPage(0)
              }}
              label={t('transfers.filters.direction')}
              sx={{ minWidth: { xs: '100%', lg: 160 } }}
            >
              <MenuItem value="">{t('transfers.filters.anyDirection')}</MenuItem>
              <MenuItem value="out">{t('transfers.directions.out')}</MenuItem>
              <MenuItem value="in">{t('transfers.directions.in')}</MenuItem>
            </TextField>
            <TextField
              select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(0)
              }}
              label={t('transfers.filters.status')}
              sx={{ minWidth: { xs: '100%', lg: 170 } }}
            >
              <MenuItem value="">{t('transfers.filters.allStatuses')}</MenuItem>
              <MenuItem value="pending">{t('transfers.status.pending')}</MenuItem>
              <MenuItem value="in_transit">{t('transfers.status.in_transit')}</MenuItem>
              <MenuItem value="received">{t('transfers.status.received')}</MenuItem>
            </TextField>
            <Box sx={{ minWidth: { xs: '100%', lg: 165 } }}>
              <AppDatePicker
                value={dateFrom}
                onChange={(value) => {
                  setDateFrom(value ?? '')
                  setPage(0)
                }}
                label={t('transfers.filters.dateFrom')}
              />
            </Box>
            <Box sx={{ minWidth: { xs: '100%', lg: 165 } }}>
              <AppDatePicker
                value={dateTo}
                onChange={(value) => {
                  setDateTo(value ?? '')
                  setPage(0)
                }}
                label={t('transfers.filters.dateTo')}
              />
            </Box>
          </Stack>

          {transfersQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(transfersQuery.error).message}
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
                  <TableCell>{t('transfers.columns.reference')}</TableCell>
                  <TableCell>{t('transfers.columns.date')}</TableCell>
                  <TableCell>{t('transfers.columns.fromWarehouse')}</TableCell>
                  <TableCell>{t('transfers.columns.toWarehouse')}</TableCell>
                  <TableCell>{t('transfers.columns.status')}</TableCell>
                  <TableCell>{t('transfers.columns.items')}</TableCell>
                  <TableCell>{t('transfers.columns.createdBy')}</TableCell>
                  <TableCell align="right">{t('transfers.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfersQuery.isLoading && <TableStateRow colSpan={8} loading />}

                {!transfersQuery.isLoading && transfers.length === 0 && (
                  <TableStateRow colSpan={8} message={t('transfers.empty')} />
                )}

                {transfers.map((transfer) => (
                  <TableRow key={transfer.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{transfer.reference_no}</Typography>
                    </TableCell>
                    <TableCell>{formatAppDate(transfer.date, dateLocale)}</TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{transfer.from_warehouse?.name ?? '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {transfer.from_warehouse?.branch_name ?? '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{transfer.to_warehouse?.name ?? '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {transfer.to_warehouse?.branch_name ?? '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`transfers.status.${transfer.status}`)}
                        color={statusColor(transfer.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{transfer.items?.length ?? 0}</TableCell>
                    <TableCell>{transfer.creator?.name || '-'}</TableCell>
                    <TableCell align="right">
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
                          sx={{ ml: 1 }}
                          onClick={() => setReceivingTransfer(transfer)}
                        >
                          {t('transfers.actions.receive')}
                        </Button>
                      )}
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
