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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { ArrowBack, CheckCircleOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useAuthStore } from '@/stores/authStore'
import {
  useCompleteStockCountMutation,
  useStockCountItemsQuery,
  useStockCountQuery,
} from './hooks'
import { formatAppDate, getAppDateLocale } from '@/utils/dateFormat'
import type { StockCountItem, StockCountStatus } from '@/types/inventory'

interface StockCountDetailPageProps {
  countId: string
}

const rowsPerPageOptions = [10, 25, 50]

const itemColumnSx = {
  product: { width: 360, minWidth: 360 },
  ending: { width: 160, minWidth: 160 },
  counted: { width: 160, minWidth: 160 },
  difference: { width: 160, minWidth: 160 },
} as const

function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(value)
}

function statusColor(status: StockCountStatus) {
  return status === 'completed' ? 'success' : 'warning'
}

function getItemLabel(item: StockCountItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function getEndingBalance(item: StockCountItem) {
  return item.ending_balance ?? item.system_quantity
}

export function StockCountDetailPage({ countId }: StockCountDetailPageProps) {
  const { t, i18n } = useTranslation(['inventory', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(25)
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false)

  const filters = useMemo(
    () => ({
      search: search || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search]
  )

  const countQuery = useStockCountQuery(countId)
  const itemsQuery = useStockCountItemsQuery(countId, filters)
  const completeCount = useCompleteStockCountMutation()

  const count = countQuery.data
  const items = itemsQuery.data?.data ?? []
  const meta = itemsQuery.data?.meta
  const canCount = can('inventory.count')
  const isInProgress = count?.status === 'in_progress'
  const dateLocale = getAppDateLocale(i18n.language)

  const confirmComplete = async () => {
    await completeCount.mutateAsync({ id: countId })
    enqueueSnackbar(t('counts.messages.completed'), { variant: 'success' })
    setConfirmCompleteOpen(false)
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4">{count?.reference_no ?? t('counts.detail.title')}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('counts.detail.viewSubtitle')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {canCount && isInProgress && (
            <>
              <Button
                variant="outlined"
                onClick={() => router.push(`/inventory/counts/${countId}/entries`)}
              >
                {t('counts.actions.openEntryForm')}
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleOutlined />}
                onClick={() => setConfirmCompleteOpen(true)}
              >
                {t('counts.actions.complete')}
              </Button>
            </>
          )}
          <Tooltip title={t('counts.actions.backToList')}>
            <IconButton
              size="small"
              aria-label={t('counts.actions.backToList')}
              onClick={() => router.push('/inventory/counts')}
            >
              <ArrowBack />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {countQuery.isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {countQuery.isError && <Alert severity="error">{toAppApiError(countQuery.error).message}</Alert>}
      {itemsQuery.isError && <Alert severity="error">{toAppApiError(itemsQuery.error).message}</Alert>}

      {count && (
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
                    {t('counts.fields.date')}
                  </Typography>
                  <Typography variant="body2">{formatAppDate(count.date, dateLocale)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('counts.fields.warehouse')}
                  </Typography>
                  <Typography variant="body2">{count.warehouse?.name ?? '-'}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {count.warehouse?.branch_name ?? '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('counts.columns.status')}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      label={t(`counts.status.${count.status}`)}
                      color={statusColor(count.status)}
                      variant="outlined"
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('counts.columns.discrepancies')}
                  </Typography>
                  <Typography variant="body2">{count.discrepancy_count}</Typography>
                </Box>
              </Box>

              {count.notes && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {count.notes}
                </Typography>
              )}

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
              >
                <Box>
                  <Typography variant="subtitle2">{t('counts.detail.items')}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('counts.detail.viewItemsHelp')}
                  </Typography>
                </Box>
                <TextField
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(0)
                  }}
                  placeholder={t('counts.filters.searchItems')}
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
                <Table size="small" sx={{ minWidth: 840, tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={itemColumnSx.product}>{t('counts.fields.product')}</TableCell>
                      <TableCell sx={itemColumnSx.ending} align="right">{t('counts.columns.endingBalance')}</TableCell>
                      <TableCell sx={itemColumnSx.counted} align="right">{t('counts.columns.countedQuantity')}</TableCell>
                      <TableCell sx={itemColumnSx.difference} align="right">{t('counts.columns.difference')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itemsQuery.isLoading && <TableStateRow colSpan={4} loading />}

                    {!itemsQuery.isLoading && items.length === 0 && (
                      <TableStateRow colSpan={4} message={t('counts.emptyItems')} />
                    )}

                    {items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={itemColumnSx.product}>
                          <Stack spacing={0.25}>
                            <Typography variant="body2">{getItemLabel(item)}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {[item.variation?.sku ?? item.product?.sku, item.lot?.lot_number].filter(Boolean).join(' / ') || '-'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{formatQuantity(getEndingBalance(item))}</TableCell>
                        <TableCell align="right">{formatQuantity(item.counted_quantity)}</TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{
                              color: Number(item.difference ?? 0) === 0
                                ? 'text.primary'
                                : Number(item.difference ?? 0) > 0
                                ? 'success.main'
                                : 'error.main',
                            }}
                          >
                            {formatQuantity(item.difference)}
                          </Typography>
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
            </Stack>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmCompleteOpen}
        title={t('counts.confirmComplete.title')}
        message={t('counts.confirmComplete.message', { reference: count?.reference_no ?? '' })}
        confirmText={t('counts.actions.complete')}
        cancelText={t('common:buttons.cancel')}
        loading={completeCount.isPending}
        confirmColor="success"
        onClose={() => setConfirmCompleteOpen(false)}
        onConfirm={confirmComplete}
      />
    </Stack>
  )
}
