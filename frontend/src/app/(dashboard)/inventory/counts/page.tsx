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
  IconButton,
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
  Tooltip,
  Typography,
} from '@mui/material'
import { Add, FactCheckOutlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useDeleteStockCountMutation, useInventoryOptionsQuery, useStockCountsQuery } from '@/features/inventory/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import type { StockCount, StockCountFilters, StockCountStatus } from '@/types/inventory'

const rowsPerPageOptions = [10, 25, 50]

function statusColor(status: StockCountStatus) {
  return status === 'completed' ? 'success' : 'warning'
}

export default function StockCountsPage() {
  const { t, i18n } = useTranslation(['inventory', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [deletingCount, setDeletingCount] = useState<StockCount | null>(null)

  const filters: StockCountFilters = useMemo(
    () => ({
      search: search || undefined,
      warehouse_id: warehouseFilter || undefined,
      status: statusFilter ? (statusFilter as StockCountStatus) : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [dateFrom, dateTo, page, perPage, search, statusFilter, warehouseFilter]
  )

  const optionsQuery = useInventoryOptionsQuery()
  const countsQuery = useStockCountsQuery(filters)
  const deleteCount = useDeleteStockCountMutation()
  const counts = countsQuery.data?.data ?? []
  const warehouses = optionsQuery.data?.warehouses ?? []
  const meta = countsQuery.data?.meta
  const canCount = can('inventory.count')
  const dateFormat = useAppDateFormat()

  const confirmDelete = async () => {
    if (!deletingCount) return

    await deleteCount.mutateAsync(deletingCount.id)
    enqueueSnackbar(t('counts.messages.deleted'), { variant: 'success' })
    setDeletingCount(null)
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
            <FactCheckOutlined color="primary" />
            <Typography variant="h4">{t('counts.title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('counts.subtitle')}
          </Typography>
        </Box>
        {canCount && (
          <Button startIcon={<Add />} variant="contained" onClick={() => router.push('/inventory/counts/create')}>
            {t('counts.actions.new')}
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
              placeholder={t('counts.filters.search')}
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
              label={t('counts.filters.warehouse')}
              placeholder={t('counts.filters.allWarehouses')}
              getOptionValue={(warehouse) => warehouse.id}
              getOptionLabel={(warehouse) => warehouse.name}
              getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')}
              onChange={(value) => {
                setWarehouseFilter(value)
                setPage(0)
              }}
              sx={{ minWidth: { xs: '100%', lg: 220 } }}
            />
            <TextField
              select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(0)
              }}
              label={t('counts.filters.status')}
              sx={{ minWidth: { xs: '100%', lg: 170 } }}
            >
              <MenuItem value="">{t('counts.filters.allStatuses')}</MenuItem>
              <MenuItem value="in_progress">{t('counts.status.in_progress')}</MenuItem>
              <MenuItem value="completed">{t('counts.status.completed')}</MenuItem>
            </TextField>
            <Box sx={{ minWidth: { xs: '100%', lg: 165 } }}>
              <AppDatePicker
                value={dateFrom}
                onChange={(value) => {
                  setDateFrom(value ?? '')
                  setPage(0)
                }}
                label={t('counts.filters.dateFrom')}
              />
            </Box>
            <Box sx={{ minWidth: { xs: '100%', lg: 165 } }}>
              <AppDatePicker
                value={dateTo}
                onChange={(value) => {
                  setDateTo(value ?? '')
                  setPage(0)
                }}
                label={t('counts.filters.dateTo')}
              />
            </Box>
          </Stack>

          {countsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(countsQuery.error).message}
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
                  <TableCell>{t('counts.columns.reference')}</TableCell>
                  <TableCell>{t('counts.columns.date')}</TableCell>
                  <TableCell>{t('counts.columns.warehouse')}</TableCell>
                  <TableCell>{t('counts.columns.status')}</TableCell>
                  <TableCell align="right">{t('counts.columns.discrepancies')}</TableCell>
                  <TableCell>{t('counts.columns.createdBy')}</TableCell>
                  <TableCell>{t('counts.columns.completedBy')}</TableCell>
                  <TableCell align="right">{t('counts.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {countsQuery.isLoading && <TableStateRow colSpan={8} loading />}

                {!countsQuery.isLoading && counts.length === 0 && (
                  <TableStateRow colSpan={8} message={t('counts.empty')} />
                )}

                {counts.map((count) => (
                  <TableRow key={count.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{count.reference_no}</Typography>
                    </TableCell>
                    <TableCell>{formatAppDate(count.date, dateFormat, i18n.language)}</TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{count.warehouse?.name ?? '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {count.warehouse?.branch_name ?? '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`counts.status.${count.status}`)}
                        color={statusColor(count.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{count.discrepancy_count}</TableCell>
                    <TableCell>{count.creator?.name || '-'}</TableCell>
                    <TableCell>{count.completer?.name || '-'}</TableCell>
                    <TableCell align="right">
                      <RowActions
                        viewLabel={t('counts.actions.view')}
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showView
                        showEdit={false}
                        showDelete={canCount && count.status === 'in_progress'}
                        onView={() => router.push(`/inventory/counts/${count.id}`)}
                        onDelete={() => setDeletingCount(count)}
                      />
                      {canCount && count.status === 'in_progress' && (
                        <Tooltip title={t('counts.actions.openEntryForm')}>
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label={t('counts.actions.openEntryForm')}
                            onClick={() => router.push(`/inventory/counts/${count.id}/entries`)}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
        open={!!deletingCount}
        title={t('counts.confirmDelete.title')}
        message={t('counts.confirmDelete.message', { reference: deletingCount?.reference_no ?? '' })}
        confirmText={t('common:buttons.delete')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteCount.isPending}
        confirmColor="error"
        onClose={() => setDeletingCount(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  )
}
