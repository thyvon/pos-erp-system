'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import { ArrowBack, CheckCircleOutlined } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useReceiveStockTransferMutation, useStockTransferQuery } from './hooks'
import { useAuthStore } from '@/stores/authStore'
import type { StockTransferStatus } from '@/types/inventory'

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

export function StockTransferDetailPage({ transferId }: StockTransferDetailPageProps) {
  const { t } = useTranslation(['inventory', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [confirmReceiveOpen, setConfirmReceiveOpen] = useState(false)
  const transferQuery = useStockTransferQuery(transferId)
  const receiveTransfer = useReceiveStockTransferMutation()
  const transfer = transferQuery.data
  const canReceive = can('inventory.transfer') && transfer?.status === 'in_transit'

  const confirmReceive = async () => {
    if (!transfer) return

    await receiveTransfer.mutateAsync(transfer.id)
    enqueueSnackbar(t('transfers.messages.received'), { variant: 'success' })
    setConfirmReceiveOpen(false)
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4">{transfer?.reference_no ?? t('transfers.detail.title')}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('transfers.detail.subtitle')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
        <Card>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('transfers.fields.date')}
                  </Typography>
                  <Typography variant="body2">{transfer.date}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('transfers.fields.fromWarehouse')}
                  </Typography>
                  <Typography variant="body2">{transfer.from_warehouse?.name ?? '-'}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {transfer.from_warehouse?.branch_name ?? '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('transfers.fields.toWarehouse')}
                  </Typography>
                  <Typography variant="body2">{transfer.to_warehouse?.name ?? '-'}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {transfer.to_warehouse?.branch_name ?? '-'}
                  </Typography>
                </Box>
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
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('transfers.columns.createdBy')}
                  </Typography>
                  <Typography variant="body2">{transfer.creator?.name ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('transfers.fields.sender')}
                  </Typography>
                  <Typography variant="body2">{transfer.sender?.name ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('transfers.fields.receiver')}
                  </Typography>
                  <Typography variant="body2">{transfer.receiver?.name ?? '-'}</Typography>
                </Box>
              </Box>

              <Divider />

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('transfers.fields.product')}</TableCell>
                      <TableCell align="right">{t('transfers.fields.quantity')}</TableCell>
                      <TableCell align="right">{t('transfers.fields.unitCost')}</TableCell>
                      <TableCell>{t('transfers.fields.notes')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transfer.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="body2">
                              {item.product?.name ?? '-'}
                              {item.variation ? ` / ${item.variation.name}` : ''}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {[item.product?.sku, item.lot?.lot_number, item.serial?.serial_number]
                                .filter(Boolean)
                                .join(' / ') || '-'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{formatQuantity(item.quantity)}</TableCell>
                        <TableCell align="right">{formatQuantity(item.unit_cost)}</TableCell>
                        <TableCell>{item.notes ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {transfer.notes && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {transfer.notes}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
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
