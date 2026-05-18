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
import { Add, Inventory2Outlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { StockAdjustmentFormDialog } from '@/features/inventory/StockAdjustmentFormDialog'
import {
  useCreateStockAdjustmentMutation,
  useInventoryOptionsQuery,
  useStockAdjustmentQuery,
  useStockAdjustmentsQuery,
  useUpdateStockAdjustmentMutation,
} from '@/features/inventory/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { StockAdjustment, StockAdjustmentFilters, StockAdjustmentPayload } from '@/types/inventory'

const rowsPerPageOptions = [10, 25, 50]

function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(value)
}

export default function StockAdjustmentsPage() {
  const { t } = useTranslation(['inventory', 'common'])
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

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Inventory2Outlined color="primary" />
            <Typography variant="h4">{t('adjustments.title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('adjustments.subtitle')}
          </Typography>
        </Box>
        {canCreate && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('adjustments.actions.new')}
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
              placeholder={t('adjustments.filters.search')}
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
              label={t('adjustments.filters.warehouse')}
              sx={{ minWidth: { xs: '100%', lg: 240 } }}
            >
              <MenuItem value="">{t('adjustments.filters.allWarehouses')}</MenuItem>
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                  {warehouse.code ? ` (${warehouse.code})` : ''}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ minWidth: { xs: '100%', lg: 170 } }}>
              <AppDatePicker
              value={dateFrom}
              onChange={(value) => {
                setDateFrom(value ?? '')
                setPage(0)
              }}
              label={t('adjustments.filters.dateFrom')}
              />
            </Box>
            <Box sx={{ minWidth: { xs: '100%', lg: 170 } }}>
              <AppDatePicker
              value={dateTo}
              onChange={(value) => {
                setDateTo(value ?? '')
                setPage(0)
              }}
              label={t('adjustments.filters.dateTo')}
              />
            </Box>
          </Stack>

          {adjustmentsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(adjustmentsQuery.error).message}
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
                  <TableCell>{t('adjustments.columns.reference')}</TableCell>
                  <TableCell>{t('adjustments.columns.date')}</TableCell>
                  <TableCell>{t('adjustments.columns.warehouse')}</TableCell>
                  <TableCell>{t('adjustments.columns.reason')}</TableCell>
                  <TableCell>{t('adjustments.columns.items')}</TableCell>
                  <TableCell>{t('adjustments.columns.createdBy')}</TableCell>
                  <TableCell align="right">{t('adjustments.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adjustmentsQuery.isLoading && <TableStateRow colSpan={7} loading />}

                {!adjustmentsQuery.isLoading && adjustments.length === 0 && (
                  <TableStateRow colSpan={7} message={t('adjustments.empty')} />
                )}

                {adjustments.map((adjustment) => (
                  <TableRow key={adjustment.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{adjustment.reference_no}</Typography>
                    </TableCell>
                    <TableCell>{adjustment.date}</TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{adjustment.warehouse?.name ?? '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {adjustment.warehouse?.branch_name ?? '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{adjustment.reason || '-'}</TableCell>
                    <TableCell>{adjustment.items?.length ?? 0}</TableCell>
                    <TableCell>{adjustment.creator?.name || '-'}</TableCell>
                    <TableCell align="right">
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
                  <Typography variant="body2">{selectedAdjustment.date}</Typography>
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
