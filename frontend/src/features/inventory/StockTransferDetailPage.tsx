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
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  TextField,
} from '@mui/material'
import {
  ArrowBack,
  CheckCircleOutlined,
  EditOutlined,
  Search,
} from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useReceiveStockTransferMutation, useStockTransferQuery } from './hooks'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import type { StockTransferItem, StockTransferStatus } from '@/types/inventory'

interface StockTransferDetailPageProps {
  transferId: string
}

const rowsPerPageOptions = [10, 25, 50]

function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(value)
}

function statusColor(status: StockTransferStatus) {
  if (status === 'received') return 'success'
  if (status === 'in_transit') return 'info'
  return 'warning'
}

function getItemLabel(item: StockTransferItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function getItemCodeLine(item: StockTransferItem) {
  return [item.variation?.sku ?? item.product?.sku, item.lot?.lot_number, item.serial?.serial_number]
    .filter(Boolean)
    .join(' / ') || '-'
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  )
}

const itemColumnSx = {
  product: { width: 360, minWidth: 360 },
  quantity: { width: 150, minWidth: 150 },
  unitCost: { width: 150, minWidth: 150 },
  notes: { width: 280, minWidth: 280 },
} as const

export function StockTransferDetailPage({ transferId }: StockTransferDetailPageProps) {
  const { t, i18n } = useTranslation(['inventory', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [confirmReceiveOpen, setConfirmReceiveOpen] = useState(false)
  const [itemSearch, setItemSearch] = useState('')
  const [itemPage, setItemPage] = useState(0)
  const [itemPerPage, setItemPerPage] = useState(10)
  const transferQuery = useStockTransferQuery(transferId)
  const receiveTransfer = useReceiveStockTransferMutation()
  const transfer = transferQuery.data
  const canTransfer = can('inventory.transfer')
  const canReceive = canTransfer && transfer?.status === 'in_transit'
  const canEdit = canTransfer && !!transfer && transfer.status !== 'received'
  const dateFormat = useAppDateFormat()
  const filteredItems = useMemo(() => {
    if (!transfer) return []

    const term = itemSearch.trim().toLowerCase()
    if (!term) return transfer.items

    return transfer.items.filter((item) =>
      [
        getItemLabel(item),
        getItemCodeLine(item),
        item.notes,
        item.quantity,
        item.unit_cost,
      ].some((value) => String(value ?? '').toLowerCase().includes(term))
    )
  }, [itemSearch, transfer])
  const paginatedItems = useMemo(
    () => filteredItems.slice(itemPage * itemPerPage, itemPage * itemPerPage + itemPerPage),
    [filteredItems, itemPage, itemPerPage]
  )

  const confirmReceive = async () => {
    if (!transfer) return

    await receiveTransfer.mutateAsync(transfer.id)
    enqueueSnackbar(t('transfers.messages.received'), { variant: 'success' })
    setConfirmReceiveOpen(false)
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h4">{transfer?.reference_no ?? t('transfers.detail.title')}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('transfers.detail.subtitle')}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<EditOutlined />}
              onClick={() => router.push(`/inventory/transfers/${transfer.id}/edit`)}
            >
              {t('common:buttons.edit')}
            </Button>
          )}
          {canReceive && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlined />}
              onClick={() => setConfirmReceiveOpen(true)}
            >
              {t('transfers.actions.receive')}
            </Button>
          )}
          <Tooltip title={t('transfers.actions.backToList')}>
            <IconButton
              size="small"
              aria-label={t('transfers.actions.backToList')}
              onClick={() => router.push('/inventory/transfers')}
            >
              <ArrowBack />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {transferQuery.isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {transferQuery.isError && (
        <Alert severity="error">{toAppApiError(transferQuery.error).message}</Alert>
      )}

      {transfer && !transferQuery.isLoading && (
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
                    gap: 2,
                  }}
                >
                  <DetailItem
                    label={t('transfers.fields.date')}
                    value={formatAppDate(transfer.date, dateFormat, i18n.language)}
                  />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {t('transfers.columns.status')}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        size="small"
                        label={t(`transfers.status.${transfer.status}`)}
                        color={statusColor(transfer.status)}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <DetailItem label={t('transfers.fields.fromWarehouse')} value={(
                    <Stack spacing={0.25}>
                      <span>{transfer.from_warehouse?.name ?? '-'}</span>
                      <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                        {transfer.from_warehouse?.branch_name ?? '-'}
                      </Typography>
                    </Stack>
                  )} />
                  <DetailItem label={t('transfers.fields.toWarehouse')} value={(
                    <Stack spacing={0.25}>
                      <span>{transfer.to_warehouse?.name ?? '-'}</span>
                      <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                        {transfer.to_warehouse?.branch_name ?? '-'}
                      </Typography>
                    </Stack>
                  )} />
                  <DetailItem
                    label={t('transfers.detail.sentAt')}
                    value={formatAppDateTime(transfer.sent_at, dateFormat, i18n.language)}
                  />
                  <DetailItem
                    label={t('transfers.detail.receivedAt')}
                    value={formatAppDateTime(transfer.received_at, dateFormat, i18n.language)}
                  />
                  <DetailItem label={t('transfers.columns.createdBy')} value={transfer.creator?.name ?? '-'} />
                  <DetailItem label={t('transfers.fields.sender')} value={transfer.sender?.name ?? '-'} />
                  <DetailItem label={t('transfers.fields.receiver')} value={transfer.receiver?.name ?? '-'} />
                  <DetailItem label={t('transfers.columns.items')} value={transfer.items.length} />
                </Box>

                {transfer.notes && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {transfer.notes}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack spacing={2.5}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography variant="subtitle2">{t('transfers.detail.items')}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('transfers.detail.itemsHelp')}
                    </Typography>
                  </Box>
                  <TextField
                    value={itemSearch}
                    onChange={(event) => {
                      setItemSearch(event.target.value)
                      setItemPage(0)
                    }}
                    placeholder={t('transfers.filters.searchItems')}
                    size="small"
                    sx={{ width: { xs: '100%', sm: 320 } }}
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
                </Stack>

                <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 940, tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={itemColumnSx.product}>{t('transfers.fields.product')}</TableCell>
                        <TableCell sx={itemColumnSx.quantity} align="right">{t('transfers.fields.quantity')}</TableCell>
                        <TableCell sx={itemColumnSx.unitCost} align="right">{t('transfers.fields.unitCost')}</TableCell>
                        <TableCell sx={itemColumnSx.notes}>{t('transfers.fields.notes')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transfer.items.length === 0 && (
                        <TableStateRow colSpan={4} message={t('transfers.emptyItems')} />
                      )}

                      {transfer.items.length > 0 && filteredItems.length === 0 && (
                        <TableStateRow colSpan={4} message={t('transfers.emptyFilteredItems')} />
                      )}

                      {paginatedItems.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell sx={itemColumnSx.product}>
                            <Stack spacing={0.25}>
                              <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                                {getItemLabel(item)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}>
                                {getItemCodeLine(item)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={itemColumnSx.quantity}>
                            {formatQuantity(item.quantity)}
                          </TableCell>
                          <TableCell align="right" sx={itemColumnSx.unitCost}>
                            {formatQuantity(item.unit_cost)}
                          </TableCell>
                          <TableCell sx={itemColumnSx.notes}>
                            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                              {item.notes ?? '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={filteredItems.length}
                  page={itemPage}
                  rowsPerPage={itemPerPage}
                  rowsPerPageOptions={rowsPerPageOptions}
                  onPageChange={(_, nextPage) => setItemPage(nextPage)}
                  onRowsPerPageChange={(event) => {
                    setItemPerPage(Number(event.target.value))
                    setItemPage(0)
                  }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}

      <ConfirmDialog
        open={confirmReceiveOpen}
        title={t('transfers.confirmReceive.title')}
        message={t('transfers.confirmReceive.message', { reference: transfer?.reference_no ?? '' })}
        confirmText={t('transfers.actions.receive')}
        cancelText={t('common:buttons.cancel')}
        loading={receiveTransfer.isPending}
        confirmColor="success"
        onClose={() => setConfirmReceiveOpen(false)}
        onConfirm={confirmReceive}
      />
    </Stack>
  )
}
