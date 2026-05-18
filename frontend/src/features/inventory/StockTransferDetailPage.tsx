'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  ArrowBack,
  CheckCircleOutlined,
  EditOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  WarehouseOutlined,
} from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useReceiveStockTransferMutation, useStockTransferQuery } from './hooks'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate, formatAppDateTime, getAppDateLocale } from '@/utils/dateFormat'
import type { StockTransferItem, StockTransferStatus } from '@/types/inventory'

interface StockTransferDetailPageProps {
  transferId: string
}

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

function TimelineItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'max-content minmax(0, 1fr)',
        columnGap: 1,
        alignItems: 'baseline',
        minWidth: 0,
      }}
    >
      <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
        {label}:
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
          {subtitle}
        </Typography>
      )}
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
  const transferQuery = useStockTransferQuery(transferId)
  const receiveTransfer = useReceiveStockTransferMutation()
  const transfer = transferQuery.data
  const canTransfer = can('inventory.transfer')
  const canReceive = canTransfer && transfer?.status === 'in_transit'
  const canEdit = canTransfer && !!transfer && transfer.status !== 'received'
  const dateLocale = getAppDateLocale(i18n.language)

  const confirmReceive = async () => {
    if (!transfer) return

    await receiveTransfer.mutateAsync(transfer.id)
    enqueueSnackbar(t('transfers.messages.received'), { variant: 'success' })
    setConfirmReceiveOpen(false)
  }

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={2} sx={{ minWidth: 0, alignItems: 'center' }}>
          <Avatar
            variant="rounded"
            sx={{ width: 56, height: 56, borderRadius: 1, bgcolor: 'action.hover', color: 'text.secondary' }}
          >
            <LocalShippingOutlined />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="h4" sx={{ overflowWrap: 'anywhere' }}>
                {transfer?.reference_no ?? t('transfers.detail.title')}
              </Typography>
              {transfer && (
                <Chip
                  size="small"
                  label={t(`transfers.status.${transfer.status}`)}
                  color={statusColor(transfer.status)}
                  variant="outlined"
                />
              )}
            </Stack>
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
              {t('transfers.detail.subtitle')}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', justifyContent: { xs: 'flex-end', md: 'initial' } }}
        >
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
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr)' },
              minHeight: 420,
            }}
          >
            <Box
              sx={{
                borderRight: { xs: 0, lg: 1 },
                borderBottom: { xs: 1, lg: 0 },
                borderColor: 'divider',
                p: 3,
              }}
            >
              <Stack spacing={2.5}>
                <Stack spacing={1.5}>
                  <TimelineItem label={t('transfers.fields.date')} value={formatAppDate(transfer.date, dateLocale)} />
                  <TimelineItem
                    label={t('transfers.detail.sentAt')}
                    value={formatAppDateTime(transfer.sent_at, dateLocale)}
                  />
                  <TimelineItem
                    label={t('transfers.detail.receivedAt')}
                    value={formatAppDateTime(transfer.received_at, dateLocale)}
                  />
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  <TimelineItem label={t('transfers.columns.createdBy')} value={transfer.creator?.name ?? '-'} />
                  <TimelineItem label={t('transfers.fields.sender')} value={transfer.sender?.name ?? '-'} />
                  <TimelineItem label={t('transfers.fields.receiver')} value={transfer.receiver?.name ?? '-'} />
                </Stack>
              </Stack>
            </Box>

            <Stack spacing={3} sx={{ p: 3, minWidth: 0 }}>
              <SectionTitle title={t('transfers.detail.movement')} subtitle={t('transfers.detail.movementHelp')} />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 48px minmax(0, 1fr)' },
                  gap: 2,
                  alignItems: 'stretch',
                }}
              >
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, minWidth: 0 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                    <Avatar
                      variant="rounded"
                      sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: 'action.hover', color: 'text.secondary' }}
                    >
                      <WarehouseOutlined />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('transfers.fields.fromWarehouse')}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                        {transfer.from_warehouse?.name ?? '-'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}>
                        {transfer.from_warehouse?.branch_name ?? '-'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    transform: { xs: 'rotate(90deg)', md: 'none' },
                  }}
                >
                  <LocalShippingOutlined />
                </Box>

                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, minWidth: 0 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                    <Avatar
                      variant="rounded"
                      sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: 'action.hover', color: 'text.secondary' }}
                    >
                      <Inventory2Outlined />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('transfers.fields.toWarehouse')}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                        {transfer.to_warehouse?.name ?? '-'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}>
                        {transfer.to_warehouse?.branch_name ?? '-'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <DetailItem label={t('transfers.columns.items')} value={transfer.items.length} />
                <DetailItem label={t('transfers.fields.notes')} value={transfer.notes || '-'} />
              </Box>

              <Divider />

              <Stack spacing={1.5}>
                <SectionTitle title={t('transfers.detail.items')} subtitle={t('transfers.detail.itemsHelp')} />

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

                      {transfer.items.map((item) => (
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
              </Stack>
            </Stack>
          </Box>
        </Box>
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
