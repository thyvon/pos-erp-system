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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { ArrowBack, EditOutlined, SaveOutlined, Search } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { InventoryProductLookupPicker } from './components/InventoryProductLookupPicker'
import {
  useAddStockCountEntryMutation,
  useStockCountEntriesQuery,
  useStockCountItemsQuery,
  useStockCountQuery,
  useUpdateStockCountEntryMutation,
} from './hooks'
import { formatAppDateTime } from '@/utils/dateFormat'
import type { InventoryProductLookupItem, StockCountEntry, StockCountItem, StockCountStatus } from '@/types/inventory'

interface StockCountEntryPageProps {
  countId: string
}

const rowsPerPageOptions = [10, 25, 50]

function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(value)
}

function statusColor(status: StockCountStatus) {
  return status === 'completed' ? 'success' : 'warning'
}

function getItemLabel(item: StockCountItem | StockCountEntry) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function getEndingBalance(item: StockCountItem) {
  return item.ending_balance ?? item.system_quantity
}

export function StockCountEntryPage({ countId }: StockCountEntryPageProps) {
  const { t, i18n } = useTranslation(['inventory', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [selectedItem, setSelectedItem] = useState<InventoryProductLookupItem | null>(null)
  const [entryQuantity, setEntryQuantity] = useState('1')
  const [itemSearch, setItemSearch] = useState('')
  const [itemPage, setItemPage] = useState(0)
  const [itemPerPage, setItemPerPage] = useState(10)
  const [entrySearch, setEntrySearch] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(25)
  const [serverError, setServerError] = useState('')
  const [editingEntry, setEditingEntry] = useState<StockCountEntry | null>(null)
  const [editingQuantity, setEditingQuantity] = useState('')

  const countQuery = useStockCountQuery(countId)
  const count = countQuery.data
  const canCount = can('inventory.count')
  const canRecordEntries = canCount && count?.status === 'in_progress'
  const dateFormat = useAppDateFormat()
  const selectedItemSearch = selectedItem?.sku ?? selectedItem?.product_name ?? selectedItem?.label ?? undefined

  const selectedItemsQuery = useStockCountItemsQuery(countId, {
    search: selectedItemSearch,
    page: 1,
    per_page: 10,
  })

  const entriesFilters = useMemo(
    () => ({
      search: entrySearch || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [entrySearch, page, perPage]
  )

  const itemFilters = useMemo(
    () => ({
      search: itemSearch || undefined,
      page: itemPage + 1,
      per_page: itemPerPage,
    }),
    [itemPage, itemPerPage, itemSearch]
  )

  const entriesQuery = useStockCountEntriesQuery(countId, entriesFilters)
  const countItemsQuery = useStockCountItemsQuery(countId, itemFilters)
  const addEntry = useAddStockCountEntryMutation()
  const updateEntry = useUpdateStockCountEntryMutation()
  const entries = entriesQuery.data?.data ?? []
  const meta = entriesQuery.data?.meta
  const countItems = countItemsQuery.data?.data ?? []
  const itemMeta = countItemsQuery.data?.meta
  const selectedCountItem = selectedItem
    ? selectedItemsQuery.data?.data.find((item) =>
        item.product_id === selectedItem.product_id
        && (item.variation_id ?? null) === (selectedItem.variation_id ?? null)
        && ((item.lot?.id ?? null) === (selectedItem.lot_id ?? null))
      ) ?? null
    : null

  const selectLookupItem = (item: InventoryProductLookupItem) => {
    setSelectedItem(item)
    setEntryQuantity('1')
  }

  const submitEntry = async () => {
    if (!selectedItem) return

    const quantity = Number(entryQuantity)

    if (entryQuantity === '' || !Number.isFinite(quantity) || quantity < 0) {
      setServerError(t('counts.messages.invalidEntryQuantity'))
      return
    }

    setServerError('')

    try {
      await addEntry.mutateAsync({
        id: countId,
        payload: {
          product_id: selectedItem.product_id,
          variation_id: selectedItem.variation_id ?? null,
          lot_id: selectedItem.lot_id ?? null,
          quantity,
          unit_cost: selectedItem.unit_cost ? Number(selectedItem.unit_cost) : 0,
        },
      })
      enqueueSnackbar(t('counts.messages.entryRecorded'), { variant: 'success' })
      setSelectedItem(null)
      setEntryQuantity('1')
      setItemSearch('')
      setItemPage(0)
      setEntrySearch('')
      setPage(0)
      await Promise.all([
        entriesQuery.refetch(),
        countItemsQuery.refetch(),
        selectedItemsQuery.refetch(),
      ])
    } catch (error) {
      setServerError(toAppApiError(error).message)
    }
  }

  const openEditEntry = (entry: StockCountEntry) => {
    setServerError('')
    setEditingEntry(entry)
    setEditingQuantity(String(Number(entry.quantity ?? 0)))
  }

  const closeEditEntry = () => {
    if (updateEntry.isPending) return

    setEditingEntry(null)
    setEditingQuantity('')
  }

  const submitEditEntry = async () => {
    if (!editingEntry) return

    const quantity = Number(editingQuantity)

    if (editingQuantity === '' || !Number.isFinite(quantity) || quantity < 0) {
      setServerError(t('counts.messages.invalidEntryQuantity'))
      return
    }

    setServerError('')

    try {
      await updateEntry.mutateAsync({
        countId,
        entryId: editingEntry.id,
        payload: { quantity },
      })
      enqueueSnackbar(t('counts.messages.entryUpdated'), { variant: 'success' })
      setEditingEntry(null)
      setEditingQuantity('')
      await Promise.all([
        entriesQuery.refetch(),
        countItemsQuery.refetch(),
        selectedItemsQuery.refetch(),
      ])
    } catch (error) {
      setServerError(toAppApiError(error).message)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Tooltip title={t('counts.actions.backToDetail')}>
          <IconButton
            size="small"
            aria-label={t('counts.actions.backToDetail')}
            onClick={() => router.push(`/inventory/counts/${countId}`)}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <PageHeader
          title={count?.reference_no ?? t('counts.entries.title')}
          description={t('counts.entries.subtitle')}
          meta={count && (
            <Chip
              size="small"
              label={t(`counts.status.${count.status}`)}
              color={statusColor(count.status)}
              variant="outlined"
            />
          )}
        />
      </Stack>

      {countQuery.isError && <Alert severity="error">{toAppApiError(countQuery.error).message}</Alert>}
      {entriesQuery.isError && <Alert severity="error">{toAppApiError(entriesQuery.error).message}</Alert>}
      {countItemsQuery.isError && <Alert severity="error">{toAppApiError(countItemsQuery.error).message}</Alert>}
      {selectedItemsQuery.isError && <Alert severity="error">{toAppApiError(selectedItemsQuery.error).message}</Alert>}
      {serverError && <Alert severity="error">{serverError}</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2">{t('counts.entries.formTitle')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('counts.entries.formHelp')}
              </Typography>
            </Box>

            {!canRecordEntries && count && (
              <Alert severity="info">{t('counts.entries.readOnly')}</Alert>
            )}

            <InventoryProductLookupPicker
              warehouseId={count?.warehouse_id}
              disabled={!canRecordEntries || addEntry.isPending || updateEntry.isPending}
              autoFocus
              helperText={t('counts.detail.entryPickerHelp')}
              onSelect={selectLookupItem}
            />

            {/* Mobile entry card */}
            {selectedItem && (
              <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: 1.5, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2">{selectedItem.label}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {[selectedItem.sku, selectedItem.lot_number].filter(Boolean).join(' / ')}
                </Typography>
                <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('counts.columns.endingBalance')}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatQuantity(selectedCountItem ? getEndingBalance(selectedCountItem) : selectedItem?.ending_quantity)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('counts.columns.countedQuantity')}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatQuantity(selectedCountItem?.counted_quantity)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(260px, 1fr) 150px 150px 170px auto' }, gap: 1.5, alignItems: 'start' }}>
              {/* Desktop product info */}
              <Box sx={{ display: { xs: 'none', lg: 'flex' }, minHeight: 'var(--app-control-height)', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('counts.fields.product')}
                </Typography>
                <Typography variant="body2">
                  {selectedItem?.label ?? '-'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {selectedItem && [selectedItem.sku, selectedItem.lot_number].filter(Boolean).join(' / ') || '-'}
                </Typography>
              </Box>

              {/* Desktop ending balance */}
              <Box sx={{ display: { xs: 'none', lg: 'flex' }, minHeight: 'var(--app-control-height)', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right' }}>
                  {t('counts.columns.endingBalance')}
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'right' }}>
                  {formatQuantity(selectedCountItem ? getEndingBalance(selectedCountItem) : selectedItem?.ending_quantity)}
                </Typography>
              </Box>

              {/* Desktop counted quantity */}
              <Box sx={{ display: { xs: 'none', lg: 'flex' }, minHeight: 'var(--app-control-height)', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right' }}>
                  {t('counts.columns.countedQuantity')}
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'right' }}>
                  {formatQuantity(selectedCountItem?.counted_quantity)}
                </Typography>
              </Box>

              <TextField
                value={entryQuantity}
                type="number"
                label={t('counts.fields.countEntryQuantity')}
                disabled={!canRecordEntries || addEntry.isPending || updateEntry.isPending || !selectedItem}
                slotProps={{ htmlInput: { min: 0, step: 0.0001, style: { textAlign: 'right' } } }}
                onChange={(event) => setEntryQuantity(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void submitEntry()
                  }
                }}
              />
              <Button
                variant="contained"
                startIcon={addEntry.isPending ? undefined : <SaveOutlined />}
                disabled={!canRecordEntries || addEntry.isPending || updateEntry.isPending || !selectedItem}
                onClick={() => void submitEntry()}
                sx={{ py: { xs: 1.5, lg: 'auto' } }}
              >
                {addEntry.isPending ? <CircularProgress size={20} color="inherit" /> : t('counts.actions.record')}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
            >
              <Box>
                <Typography variant="subtitle2">{t('counts.entries.itemTotalsTitle')}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('counts.entries.itemTotalsHelp')}
                </Typography>
              </Box>
              <TextField
                value={itemSearch}
                onChange={(event) => {
                  setItemSearch(event.target.value)
                  setItemPage(0)
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
                    <TableCell sx={{ width: 360 }}>{t('counts.fields.product')}</TableCell>
                    <TableCell align="right" sx={{ width: 160 }}>{t('counts.columns.endingBalance')}</TableCell>
                    <TableCell align="right" sx={{ width: 160 }}>{t('counts.columns.countedQuantity')}</TableCell>
                    <TableCell align="right" sx={{ width: 160 }}>{t('counts.columns.difference')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {countItemsQuery.isLoading && <TableStateRow colSpan={4} loading />}

                  {!countItemsQuery.isLoading && countItems.length === 0 && (
                    <TableStateRow colSpan={4} message={t('counts.emptyItems')} />
                  )}

                  {countItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
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
              count={itemMeta?.total ?? 0}
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

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
            >
              <Box>
                <Typography variant="subtitle2">{t('counts.entries.listTitle')}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('counts.entries.listHelp')}
                </Typography>
              </Box>
              <TextField
                value={entrySearch}
                onChange={(event) => {
                  setEntrySearch(event.target.value)
                  setPage(0)
                }}
                placeholder={t('counts.filters.searchEntries')}
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
              <Table size="small" sx={{ minWidth: 1000, tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 320 }}>{t('counts.fields.product')}</TableCell>
                    <TableCell align="right" sx={{ width: 150 }}>{t('counts.fields.countEntryQuantity')}</TableCell>
                    <TableCell align="right" sx={{ width: 140 }}>{t('counts.fields.unitCost')}</TableCell>
                    <TableCell sx={{ width: 180 }}>{t('counts.columns.countedBy')}</TableCell>
                    <TableCell sx={{ width: 190 }}>{t('counts.columns.countedAt')}</TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>{t('counts.columns.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entriesQuery.isLoading && <TableStateRow colSpan={6} loading />}

                  {!entriesQuery.isLoading && entries.length === 0 && (
                    <TableStateRow colSpan={6} message={t('counts.emptyEntries')} />
                  )}

                  {entries.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="body2">{getItemLabel(entry)}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {[entry.variation?.sku ?? entry.product?.sku, entry.lot?.lot_number].filter(Boolean).join(' / ') || '-'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{formatQuantity(entry.quantity)}</TableCell>
                      <TableCell align="right">{formatQuantity(entry.unit_cost)}</TableCell>
                      <TableCell>{entry.creator?.name ?? '-'}</TableCell>
                      <TableCell>{formatAppDateTime(entry.created_at, dateFormat, i18n.language)}</TableCell>
                      <TableCell align="center">
                        {canRecordEntries ? (
                          <Tooltip title={t('counts.actions.editEntry')}>
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={addEntry.isPending || updateEntry.isPending}
                                aria-label={t('counts.actions.editEntry')}
                                onClick={() => openEditEntry(entry)}
                              >
                                <EditOutlined fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : '-'}
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

      <Dialog open={!!editingEntry} onClose={closeEditEntry} fullWidth maxWidth="sm">
        <DialogTitle>{t('counts.dialogs.editEntryTitle')}</DialogTitle>
        <DialogContent dividers>
          {editingEntry && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('counts.fields.product')}
                </Typography>
                <Typography variant="body2">{getItemLabel(editingEntry)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {[editingEntry.variation?.sku ?? editingEntry.product?.sku, editingEntry.lot?.lot_number].filter(Boolean).join(' / ') || '-'}
                </Typography>
              </Box>
              <TextField
                autoFocus
                value={editingQuantity}
                type="number"
                label={t('counts.fields.countEntryQuantity')}
                disabled={updateEntry.isPending}
                slotProps={{ htmlInput: { min: 0, step: 0.0001, style: { textAlign: 'right' } } }}
                onChange={(event) => setEditingQuantity(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void submitEditEntry()
                  }
                }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" disabled={updateEntry.isPending} onClick={closeEditEntry}>
            {t('common:buttons.cancel')}
          </Button>
          <Button
            variant="contained"
            startIcon={updateEntry.isPending ? undefined : <SaveOutlined />}
            disabled={updateEntry.isPending}
            onClick={() => void submitEditEntry()}
          >
            {updateEntry.isPending ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
