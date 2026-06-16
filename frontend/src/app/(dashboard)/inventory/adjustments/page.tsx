'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Add, Inventory2Outlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { StockAdjustmentFormDialog } from '@/features/inventory/StockAdjustmentFormDialog'
import {
  useCreateStockAdjustmentMutation,
  useInventoryOptionsQuery,
  useStockAdjustmentQuery,
  useStockAdjustmentsQuery,
  useUpdateStockAdjustmentMutation,
} from '@/features/inventory/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import type { StockAdjustment, StockAdjustmentFilters, StockAdjustmentPayload } from '@/types/inventory'

function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(value)
}

export default function StockAdjustmentsPage() {
  const { t, i18n } = useTranslation(['inventory', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAdjustment, setEditingAdjustment] = useState<StockAdjustment | null>(null)
  const [viewingAdjustment, setViewingAdjustment] = useState<StockAdjustment | null>(null)

  const filters: StockAdjustmentFilters = useMemo(
    () => ({
      search: search || undefined,
      warehouse_id: warehouseFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [dateFrom, dateTo, page, perPage, search, warehouseFilter]
  )

  const optionsQuery = useInventoryOptionsQuery()
  const adjustmentsQuery = useStockAdjustmentsQuery(filters)
  const createAdjustment = useCreateStockAdjustmentMutation()
  const updateAdjustment = useUpdateStockAdjustmentMutation()
  const detailQuery = useStockAdjustmentQuery(viewingAdjustment?.id ?? null)

  const adjustments = adjustmentsQuery.data?.data ?? []
  const warehouses = optionsQuery.data?.warehouses ?? []
  const meta = adjustmentsQuery.data?.meta
  const canCreate = can('inventory.adjust')
  const selectedAdjustment = detailQuery.data ?? viewingAdjustment
  const isSaving = createAdjustment.isPending || updateAdjustment.isPending
  const dateFormat = useAppDateFormat()

  const handleSubmit = async (payload: StockAdjustmentPayload) => {
    if (editingAdjustment) {
      await updateAdjustment.mutateAsync({ id: editingAdjustment.id, payload })
      enqueueSnackbar(t('adjustments.messages.updated'), { variant: 'success' })
      setEditingAdjustment(null)
    } else {
      await createAdjustment.mutateAsync(payload)
      enqueueSnackbar(t('adjustments.messages.created'), { variant: 'success' })
    }

    setPage(0)
  }

  const openCreateForm = () => {
    setEditingAdjustment(null)
    setFormOpen(true)
  }

  const openEditForm = (adjustment: StockAdjustment) => {
    setEditingAdjustment(adjustment)
    setFormOpen(true)
  }

  const closeForm = () => {
    if (isSaving) return

    setFormOpen(false)
    setEditingAdjustment(null)
  }

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(0)
  }, [])

  const handleWarehouseChange = useCallback((value: string) => {
    setWarehouseFilter(value)
    setPage(0)
  }, [])

  const handleDateFromChange = useCallback((value: string | null) => {
    setDateFrom(value ?? '')
    setPage(0)
  }, [])

  const handleDateToChange = useCallback((value: string | null) => {
    setDateTo(value ?? '')
    setPage(0)
  }, [])

  const clearFilters = useCallback(() => {
    setWarehouseFilter('')
    setDateFrom('')
    setDateTo('')
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
    if (dateFrom) {
      chips.push({
        key: 'dateFrom',
        label: `${t('adjustments.filters.dateFrom')}: ${dateFrom}`,
        onDelete: () => { setDateFrom(''); setPage(0) },
      })
    }
    if (dateTo) {
      chips.push({
        key: 'dateTo',
        label: `${t('adjustments.filters.dateTo')}: ${dateTo}`,
        onDelete: () => { setDateTo(''); setPage(0) },
      })
    }
    return chips
  }, [warehouseFilter, dateFrom, dateTo, selectedWarehouse, t])

  const columns: EntityTableColumn<StockAdjustment>[] = useMemo(() => [
    {
      key: 'reference',
      label: t('adjustments.columns.reference'),
      render: (adjustment) => (
        <Typography variant="subtitle2">{adjustment.reference_no}</Typography>
      ),
    },
    {
      key: 'date',
      label: t('adjustments.columns.date'),
      render: (adjustment) => <>{formatAppDate(adjustment.date, dateFormat, i18n.language)}</>,
    },
    {
      key: 'warehouse',
      label: t('adjustments.columns.warehouse'),
      render: (adjustment) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{adjustment.warehouse?.name ?? '-'}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {adjustment.warehouse?.branch_name ?? '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'reason',
      label: t('adjustments.columns.reason'),
      render: (adjustment) => <>{adjustment.reason || '-'}</>,
    },
    {
      key: 'items',
      label: t('adjustments.columns.items'),
      render: (adjustment) => <>{adjustment.items?.length ?? 0}</>,
    },
    {
      key: 'createdBy',
      label: t('adjustments.columns.createdBy'),
      render: (adjustment) => <>{adjustment.creator?.name || '-'}</>,
    },
  ], [t, dateFormat, i18n.language])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<Inventory2Outlined color="primary" />}
        title={t('adjustments.title')}
        description={t('adjustments.subtitle')}
        actions={canCreate && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('adjustments.actions.new')}
          </Button>
        )}
      />

      {(adjustmentsQuery.isError || optionsQuery.isError) && (
        <Stack spacing={1}>
          {adjustmentsQuery.isError && (
            <Alert severity="error">{toAppApiError(adjustmentsQuery.error).message}</Alert>
          )}
          {optionsQuery.isError && (
            <Alert severity="error">{toAppApiError(optionsQuery.error).message}</Alert>
          )}
        </Stack>
      )}

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('adjustments.filters.search')}
        onSearchChange={handleSearchChange}
        activeFilters={activeFilters}
        onClearFilters={clearFilters}
        filterButtonLabel={t('adjustments.filters.warehouse')}
        filters={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <SearchableFilterSelect
              value={warehouseFilter}
              options={warehouses}
              loading={optionsQuery.isLoading}
              label={t('adjustments.filters.warehouse')}
              placeholder={t('adjustments.filters.allWarehouses')}
              getOptionValue={(warehouse) => warehouse.id}
              getOptionLabel={(warehouse) => warehouse.name}
              getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')}
              onChange={handleWarehouseChange}
            />
            <AppDatePicker
              value={dateFrom}
              onChange={handleDateFromChange}
              label={t('adjustments.filters.dateFrom')}
            />
            <AppDatePicker
              value={dateTo}
              onChange={handleDateToChange}
              label={t('adjustments.filters.dateTo')}
            />
          </Stack>
        }
      />

      <EntityTable
        rows={adjustments}
        columns={columns}
        getRowKey={(adjustment) => adjustment.id}
        loading={adjustmentsQuery.isLoading}
        emptyIcon={<Inventory2Outlined />}
        emptyTitle={t('adjustments.empty')}
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
        rowActions={(adjustment) => (
          <RowActions
            viewLabel={t('adjustments.actions.view')}
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showView
            showEdit={canCreate}
            showDelete={false}
            onView={() => setViewingAdjustment(adjustment)}
            onEdit={() => openEditForm(adjustment)}
          />
        )}
      />

      <StockAdjustmentFormDialog
        key={editingAdjustment?.id ?? (formOpen ? 'create' : 'closed')}
        open={formOpen}
        warehouses={warehouses}
        adjustment={editingAdjustment}
        isLoadingOptions={optionsQuery.isLoading}
        isSaving={isSaving}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <Dialog open={!!viewingAdjustment} onClose={() => setViewingAdjustment(null)} fullWidth maxWidth="md">
        <DialogTitle>{selectedAdjustment?.reference_no ?? t('adjustments.detail.title')}</DialogTitle>
        <DialogContent dividers>
          {detailQuery.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}
          {detailQuery.isError && (
            <Alert severity="error">{toAppApiError(detailQuery.error).message}</Alert>
          )}
          {selectedAdjustment && !detailQuery.isLoading && (
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
                    {t('adjustments.fields.date')}
                  </Typography>
                  <Typography variant="body2">{formatAppDate(selectedAdjustment.date, dateFormat, i18n.language)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('adjustments.fields.warehouse')}
                  </Typography>
                  <Typography variant="body2">{selectedAdjustment.warehouse?.name ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('adjustments.columns.createdBy')}
                  </Typography>
                  <Typography variant="body2">{selectedAdjustment.creator?.name ?? '-'}</Typography>
                </Box>
              </Box>
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('adjustments.fields.product')}</TableCell>
                      <TableCell>{t('adjustments.fields.direction')}</TableCell>
                      <TableCell align="right">{t('adjustments.fields.quantity')}</TableCell>
                      <TableCell align="right">{t('adjustments.fields.unitCost')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedAdjustment.items.map((item) => (
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
                        <TableCell>
                          <Chip
                            size="small"
                            label={t(`adjustments.directions.${item.direction}`)}
                            color={item.direction === 'in' ? 'success' : 'warning'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{formatQuantity(item.quantity)}</TableCell>
                        <TableCell align="right">{formatQuantity(item.unit_cost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {selectedAdjustment.notes && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {selectedAdjustment.notes}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
