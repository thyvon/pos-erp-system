'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
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
import { ArrowBack, CheckCircleOutlined, DeleteOutlined, Search, SaveOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useAuthStore } from '@/stores/authStore'
import { InventoryProductLookupPicker } from './components/InventoryProductLookupPicker'
import {
  useAddStockCountEntryMutation,
  useCompleteStockCountMutation,
  useDeleteStockCountItemMutation,
  useStockCountItemsQuery,
  useStockCountQuery,
  useUpdateStockCountItemMutation,
} from './hooks'
import {
  stockCountEntrySchema,
  type StockCountEntryFormInput,
  type StockCountEntryFormValues,
} from './schema'
import type { InventoryProductLookupItem, StockCountItem, StockCountStatus } from '@/types/inventory'

interface StockCountDetailPageProps {
  countId: string
}

const rowsPerPageOptions = [10, 25, 50]

const itemColumnSx = {
  product: { width: 340, minWidth: 340 },
  system: { width: 140, minWidth: 140 },
  counted: { width: 150, minWidth: 150 },
  difference: { width: 140, minWidth: 140 },
  unitCost: { width: 140, minWidth: 140 },
  actions: { width: 88, minWidth: 88 },
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

function defaultEntryValues(): StockCountEntryFormInput {
  return {
    product_id: '',
    variation_id: null,
    lot_id: null,
    product_label: '',
    sku: null,
    lot_number: null,
    quantity: 1,
    unit_cost: 0,
  }
}

export function StockCountDetailPage({ countId }: StockCountDetailPageProps) {
  const { t } = useTranslation(['inventory', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(25)
  const [serverError, setServerError] = useState('')
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<StockCountItem | null>(null)
  const [countedDrafts, setCountedDrafts] = useState<Record<string, string>>({})
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)

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
  const addEntry = useAddStockCountEntryMutation()
  const updateItem = useUpdateStockCountItemMutation()
  const deleteItem = useDeleteStockCountItemMutation()
  const completeCount = useCompleteStockCountMutation()

  const count = countQuery.data
  const items = itemsQuery.data?.data ?? []
  const meta = itemsQuery.data?.meta
  const canCount = can('inventory.count')
  const isInProgress = count?.status === 'in_progress'
  const canRecordEntries = canCount && isInProgress
  const canCorrectItems = canCount && !!count && ['in_progress', 'completed'].includes(count.status)
  const isSaving = addEntry.isPending || updateItem.isPending || deleteItem.isPending || completeCount.isPending

  const entryForm = useForm<StockCountEntryFormInput, unknown, StockCountEntryFormValues>({
    resolver: zodResolver(stockCountEntrySchema),
    defaultValues: defaultEntryValues(),
  })

  const selectedProductId = useWatch({ control: entryForm.control, name: 'product_id' })
  const selectedProductLabel = useWatch({ control: entryForm.control, name: 'product_label' })

  const selectLookupItem = (item: InventoryProductLookupItem) => {
    entryForm.reset({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      lot_id: item.lot_id ?? null,
      product_label: item.label,
      sku: item.sku ?? null,
      lot_number: item.lot_number ?? null,
      quantity: 1,
      unit_cost: item.unit_cost ? Number(item.unit_cost) : 0,
    })
  }

  const submitEntry = async (values: StockCountEntryFormValues) => {
    setServerError('')

    try {
      await addEntry.mutateAsync({
        id: countId,
        payload: {
          product_id: values.product_id,
          variation_id: values.variation_id ?? null,
          lot_id: values.lot_id ?? null,
          quantity: values.quantity,
          unit_cost: values.unit_cost ?? 0,
        },
      })
      enqueueSnackbar(t('counts.messages.entryRecorded'), { variant: 'success' })
      entryForm.reset(defaultEntryValues())
    } catch (error) {
      setServerError(toAppApiError(error).message)
    }
  }

  const hasItemChanged = (item: StockCountItem) =>
    Number(countedDrafts[item.id] ?? 0) !== Number(item.counted_quantity ?? 0)

  const submitItemUpdate = async (item: StockCountItem) => {
    const countedQuantity = Number(countedDrafts[item.id] ?? 0)

    if (!Number.isFinite(countedQuantity) || countedQuantity < 0) {
      setServerError(t('counts.messages.invalidCountedQuantity'))
      return
    }

    setServerError('')
    setUpdatingItemId(item.id)

    try {
      await updateItem.mutateAsync({
        countId,
        itemId: item.id,
        payload: { counted_quantity: countedQuantity },
      })
      enqueueSnackbar(t('counts.messages.itemUpdated'), { variant: 'success' })
      setCountedDrafts((current) => {
        const next = { ...current }
        delete next[item.id]
        return next
      })
    } catch (error) {
      setServerError(toAppApiError(error).message)
    } finally {
      setUpdatingItemId(null)
    }
  }

  const confirmDeleteItem = async () => {
    if (!deletingItem) return

    await deleteItem.mutateAsync({ countId, itemId: deletingItem.id })
    enqueueSnackbar(t('counts.messages.itemDeleted'), { variant: 'success' })
    setDeletingItem(null)
  }

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
            {t('counts.detail.subtitle')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {canCount && isInProgress && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlined />}
              onClick={() => setConfirmCompleteOpen(true)}
            >
              {t('counts.actions.complete')}
            </Button>
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
      {serverError && <Alert severity="error">{serverError}</Alert>}

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
                  <Typography variant="body2">{count.date}</Typography>
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

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('counts.columns.createdBy')}
                  </Typography>
                  <Typography variant="body2">{count.creator?.name ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('counts.fields.completedBy')}
                  </Typography>
                  <Typography variant="body2">{count.completer?.name ?? '-'}</Typography>
                </Box>
              </Box>

              {count.notes && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {count.notes}
                </Typography>
              )}

              {canRecordEntries && (
                <>
                  <Divider />
                  <Box component="form" noValidate onSubmit={entryForm.handleSubmit(submitEntry)}>
                    <Stack spacing={1.5}>
                      <Box>
                          <Typography variant="subtitle2">{t('counts.detail.recordEntry')}</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {t('counts.detail.recordEntryHelp')}
                          </Typography>
                      </Box>
                      <InventoryProductLookupPicker
                        warehouseId={count.warehouse_id}
                        disabled={isSaving}
                        helperText={t('counts.form.pickerHelp')}
                        onSelect={selectLookupItem}
                      />
                      {selectedProductId && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 160px 160px auto' }, gap: 2, alignItems: 'start' }}>
                          <TextField
                            value={selectedProductLabel || selectedProductId}
                            label={t('counts.fields.product')}
                            disabled
                          />
                          <Controller
                            name="quantity"
                            control={entryForm.control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                type="number"
                                label={t('counts.fields.actualCountedQuantity')}
                                error={!!entryForm.formState.errors.quantity}
                                helperText={entryForm.formState.errors.quantity?.message}
                                required
                                slotProps={{ htmlInput: { step: 0.0001 } }}
                              />
                            )}
                          />
                          <Controller
                            name="unit_cost"
                            control={entryForm.control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                value={field.value ?? ''}
                                type="number"
                                label={t('counts.fields.unitCost')}
                                error={!!entryForm.formState.errors.unit_cost}
                                helperText={entryForm.formState.errors.unit_cost?.message}
                                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                              />
                            )}
                          />
                          <Button
                            type="submit"
                            variant="contained"
                            startIcon={addEntry.isPending ? undefined : <SaveOutlined />}
                            disabled={isSaving}
                            sx={{ minHeight: 56 }}
                          >
                            {addEntry.isPending ? <CircularProgress size={20} color="inherit" /> : t('counts.actions.record')}
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </>
              )}

              <Divider />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
              >
                <Typography variant="subtitle2">{t('counts.detail.items')}</Typography>
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
                <Table size="small" sx={{ minWidth: 998, tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={itemColumnSx.product}>{t('counts.fields.product')}</TableCell>
                      <TableCell sx={itemColumnSx.system} align="right">{t('counts.columns.systemQuantity')}</TableCell>
                      <TableCell sx={itemColumnSx.counted} align="right">{t('counts.fields.actualCountedQuantity')}</TableCell>
                      <TableCell sx={itemColumnSx.difference} align="right">{t('counts.columns.difference')}</TableCell>
                      <TableCell sx={itemColumnSx.unitCost} align="right">{t('counts.fields.unitCost')}</TableCell>
                      <TableCell sx={itemColumnSx.actions} align="right">{t('counts.columns.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itemsQuery.isLoading && <TableStateRow colSpan={6} loading />}

                    {!itemsQuery.isLoading && items.length === 0 && (
                      <TableStateRow colSpan={6} message={t('counts.emptyItems')} />
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
                        <TableCell align="right">{formatQuantity(item.system_quantity)}</TableCell>
                        <TableCell align="right">
                          {canCorrectItems ? (
                            <TextField
                              value={countedDrafts[item.id] ?? String(Number(item.counted_quantity ?? 0))}
                              type="number"
                              size="small"
                              disabled={isSaving || updatingItemId === item.id}
                              sx={{ width: 128 }}
                              slotProps={{ htmlInput: { min: 0, step: 0.0001, style: { textAlign: 'right' } } }}
                              onChange={(event) => {
                                setCountedDrafts((current) => ({
                                  ...current,
                                  [item.id]: event.target.value,
                                }))
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  void submitItemUpdate(item)
                                }
                              }}
                            />
                          ) : (
                            formatQuantity(item.counted_quantity)
                          )}
                        </TableCell>
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
                        <TableCell align="right">{formatQuantity(item.unit_cost)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                            {canCorrectItems && (
                              <Tooltip title={t('counts.actions.saveCountedQuantity')}>
                                <span>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    disabled={isSaving || !hasItemChanged(item) || updatingItemId === item.id}
                                    onClick={() => void submitItemUpdate(item)}
                                  >
                                    {updatingItemId === item.id ? <CircularProgress size={18} /> : <SaveOutlined fontSize="small" />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {canCount && isInProgress && (
                              <Tooltip title={t('counts.actions.removeItem')}>
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    disabled={isSaving || updatingItemId === item.id}
                                    onClick={() => setDeletingItem(item)}
                                  >
                                    <DeleteOutlined fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                          </Stack>
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
        open={!!deletingItem}
        title={t('counts.confirmDeleteItem.title')}
        message={t('counts.confirmDeleteItem.message', { item: deletingItem ? getItemLabel(deletingItem) : '' })}
        confirmText={t('common:buttons.delete')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteItem.isPending}
        confirmColor="error"
        onClose={() => setDeletingItem(null)}
        onConfirm={confirmDeleteItem}
      />

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
