'use client'

import { useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
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
import { Add, DeleteOutlined, Inventory2Outlined, SaveOutlined, Search, UploadOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { InventoryProductLookupPicker } from '@/features/inventory/components/InventoryProductLookupPicker'
import {
  useCreateStockOpeningBalanceMutation,
  useImportStockOpeningBalanceMutation,
  useInventoryOptionsQuery,
  useStockOpeningBalanceQuery,
  useStockOpeningBalancesQuery,
} from '@/features/inventory/hooks'
import {
  stockOpeningBalanceSchema,
  type StockOpeningBalanceFormInput,
  type StockOpeningBalanceFormValues,
} from '@/features/inventory/schema'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import type {
  InventoryProductLookupItem,
  InventoryWarehouseOption,
  StockImportResult,
  StockOpeningBalance,
  StockOpeningBalanceFilters,
  StockOpeningBalancePayload,
} from '@/types/inventory'

const rowsPerPageOptions = [10, 25, 50]
const today = () => new Date().toISOString().slice(0, 10)

const itemColumnSx = {
  product: { width: 280, minWidth: 280 },
  quantity: { width: 130, minWidth: 130 },
  unitCost: { width: 130, minWidth: 130 },
  tracked: { width: 210, minWidth: 210 },
  dates: { width: 190, minWidth: 190 },
  actions: { width: 72, minWidth: 72 },
} as const

function warehouseLabel(warehouse: InventoryWarehouseOption) {
  return [warehouse.name, warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')
}

function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(value)
}

function defaultValues(): StockOpeningBalanceFormInput {
  return {
    warehouse_id: '',
    date: today(),
    notes: '',
    items: [],
  }
}

function buildPayload(values: StockOpeningBalanceFormValues): StockOpeningBalancePayload {
  return {
    warehouse_id: values.warehouse_id,
    date: values.date,
    notes: values.notes ?? null,
    items: values.items.map((item) => ({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      quantity: item.quantity,
      unit_cost: item.unit_cost ?? 0,
      lot_number: item.stock_tracking === 'lot' ? item.lot_number ?? null : null,
      manufacture_date: item.stock_tracking === 'lot' ? item.manufacture_date ?? null : null,
      expiry_date: item.stock_tracking === 'lot' ? item.expiry_date ?? null : null,
      serial_number: item.stock_tracking === 'serial' ? item.serial_number ?? null : null,
      warranty_expires: item.stock_tracking === 'serial' ? item.warranty_expires ?? null : null,
      notes: item.notes ?? null,
    })),
  }
}

function OpeningBalanceDialog({
  open,
  warehouses,
  isLoadingOptions,
  isSaving,
  onClose,
  onSubmit,
}: {
  open: boolean
  warehouses: InventoryWarehouseOption[]
  isLoadingOptions: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: StockOpeningBalancePayload) => Promise<void>
}) {
  const { t } = useTranslation(['inventory', 'common'])
  const [serverError, setServerError] = useState('')
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StockOpeningBalanceFormInput, unknown, StockOpeningBalanceFormValues>({
    resolver: zodResolver(stockOpeningBalanceSchema),
    defaultValues: defaultValues(),
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items', keyName: 'fieldId' })
  const warehouseId = useWatch({ control, name: 'warehouse_id' })
  const watchedItems = useWatch({ control, name: 'items' }) ?? []

  const addLookupItem = (item: InventoryProductLookupItem) => {
    append({
      product_id: item.product_id,
      variation_id: item.variation_id ?? null,
      product_label: item.label,
      sku: item.sku ?? null,
      stock_tracking: item.stock_tracking ?? 'none',
      quantity: item.stock_tracking === 'serial' ? 1 : 1,
      unit_cost: item.unit_cost ? Number(item.unit_cost) : 0,
      lot_number: '',
      manufacture_date: '',
      expiry_date: '',
      serial_number: '',
      warranty_expires: '',
      notes: '',
    })
  }

  const closeDialog = () => {
    setServerError('')
    reset(defaultValues())
    onClose()
  }

  const submitForm = async (values: StockOpeningBalanceFormValues) => {
    setServerError('')

    try {
      await onSubmit(buildPayload(values))
      reset(defaultValues())
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof StockOpeningBalanceFormInput, { type: 'server', message: messages[0] })
        })
      }
      setServerError(apiError.message)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : closeDialog} fullWidth maxWidth="xl">
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <DialogTitle>{t('openingBalances.form.createTitle')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            {!isLoadingOptions && warehouses.length === 0 && (
              <Alert severity="warning">{t('openingBalances.messages.noWarehouses')}</Alert>
            )}
            <Alert severity="info">{t('openingBalances.form.immutableNotice')}</Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 220px' }, gap: 2 }}>
              <Controller
                name="warehouse_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={warehouses}
                    value={warehouses.find((warehouse) => warehouse.id === field.value) ?? null}
                    loading={isLoadingOptions}
                    getOptionLabel={warehouseLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    disabled={isLoadingOptions}
                    onBlur={field.onBlur}
                    onChange={(_, warehouse) => field.onChange(warehouse?.id ?? '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('openingBalances.fields.warehouse')}
                        error={!!errors.warehouse_id}
                        helperText={errors.warehouse_id?.message}
                        required
                      />
                    )}
                  />
                )}
              />
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <AppDatePicker
                    value={field.value ?? ''}
                    onChange={(value) => field.onChange(value ?? '')}
                    label={t('openingBalances.fields.date')}
                    error={!!errors.date}
                    helperText={errors.date?.message}
                    required
                  />
                )}
              />
            </Box>

            <InventoryProductLookupPicker
              warehouseId={warehouseId || undefined}
              disabled={!warehouseId || isSaving}
              label={t('openingBalances.fields.product')}
              helperText={!warehouseId ? t('openingBalances.messages.selectWarehouseFirst') : t('openingBalances.form.pickerHelp')}
              onSelect={addLookupItem}
            />

            <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Table sx={{ minWidth: 1020, tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={itemColumnSx.product}>{t('openingBalances.fields.product')}</TableCell>
                    <TableCell sx={itemColumnSx.quantity} align="right">{t('openingBalances.fields.quantity')}</TableCell>
                    <TableCell sx={itemColumnSx.unitCost} align="right">{t('openingBalances.fields.unitCost')}</TableCell>
                    <TableCell sx={itemColumnSx.tracked}>{t('openingBalances.fields.trackedValue')}</TableCell>
                    <TableCell sx={itemColumnSx.dates}>{t('openingBalances.fields.trackedDate')}</TableCell>
                    <TableCell sx={itemColumnSx.actions} align="center">{t('openingBalances.columns.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.length === 0 && <TableStateRow colSpan={6} message={t('openingBalances.emptyItems')} />}
                  {fields.map((field, index) => {
                    const tracking = watchedItems[index]?.stock_tracking ?? field.stock_tracking ?? 'none'
                    const isSerial = tracking === 'serial'
                    const isLot = tracking === 'lot'

                    return (
                      <TableRow key={field.fieldId}>
                        <TableCell sx={itemColumnSx.product}>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{field.product_label || field.product_id}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{field.sku || '-'}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={itemColumnSx.quantity} align="right">
                          <Controller
                            name={`items.${index}.quantity`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                type="number"
                                disabled={isSerial}
                                error={!!errors.items?.[index]?.quantity}
                                helperText={errors.items?.[index]?.quantity?.message}
                                slotProps={{ htmlInput: { min: 0.0001, step: 0.0001, style: { textAlign: 'right' } } }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell sx={itemColumnSx.unitCost} align="right">
                          <Controller
                            name={`items.${index}.unit_cost`}
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                type="number"
                                error={!!errors.items?.[index]?.unit_cost}
                                helperText={errors.items?.[index]?.unit_cost?.message}
                                slotProps={{ htmlInput: { min: 0, step: 0.0001, style: { textAlign: 'right' } } }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell sx={itemColumnSx.tracked}>
                          {isLot && (
                            <Controller
                              name={`items.${index}.lot_number`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  value={field.value ?? ''}
                                  label={t('openingBalances.fields.lotNumber')}
                                  error={!!errors.items?.[index]?.lot_number}
                                  helperText={errors.items?.[index]?.lot_number?.message}
                                  required
                                />
                              )}
                            />
                          )}
                          {isSerial && (
                            <Controller
                              name={`items.${index}.serial_number`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  value={field.value ?? ''}
                                  label={t('openingBalances.fields.serialNumber')}
                                  error={!!errors.items?.[index]?.serial_number}
                                  helperText={errors.items?.[index]?.serial_number?.message}
                                  required
                                />
                              )}
                            />
                          )}
                          {!isLot && !isSerial && <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('openingBalances.tracking.none')}</Typography>}
                        </TableCell>
                        <TableCell sx={itemColumnSx.dates}>
                          {isLot && (
                            <Stack spacing={1}>
                              <Controller
                                name={`items.${index}.manufacture_date`}
                                control={control}
                                render={({ field }) => (
                                  <AppDatePicker
                                    value={field.value ?? ''}
                                    onChange={(value) => field.onChange(value ?? '')}
                                    label={t('openingBalances.fields.manufactureDate')}
                                  />
                                )}
                              />
                              <Controller
                                name={`items.${index}.expiry_date`}
                                control={control}
                                render={({ field }) => (
                                  <AppDatePicker
                                    value={field.value ?? ''}
                                    onChange={(value) => field.onChange(value ?? '')}
                                    label={t('openingBalances.fields.expiryDate')}
                                  />
                                )}
                              />
                            </Stack>
                          )}
                          {isSerial && (
                            <Controller
                              name={`items.${index}.warranty_expires`}
                              control={control}
                              render={({ field }) => (
                                <AppDatePicker value={field.value ?? ''} onChange={(value) => field.onChange(value ?? '')} label={t('openingBalances.fields.warrantyExpires')} />
                              )}
                            />
                          )}
                          {!isLot && !isSerial && <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>}
                        </TableCell>
                        <TableCell sx={itemColumnSx.actions} align="center">
                          <Tooltip title={t('openingBalances.actions.removeItem')}>
                            <IconButton size="small" color="error" onClick={() => remove(index)}>
                              <DeleteOutlined />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label={t('openingBalances.fields.notes')} multiline minRows={2} />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={closeDialog} disabled={isSaving}>{t('common:buttons.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={isSaving || warehouses.length === 0}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function ImportDialog({
  open,
  warehouses,
  isLoadingOptions,
  isSaving,
  onClose,
  onSubmit,
}: {
  open: boolean
  warehouses: InventoryWarehouseOption[]
  isLoadingOptions: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (formData: FormData) => Promise<void>
}) {
  const { t } = useTranslation(['inventory', 'common'])
  const [serverError, setServerError] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [date, setDate] = useState(today())
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setServerError('')
    setWarehouseId('')
    setDate(today())
    setNotes('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const closeDialog = () => {
    if (isSaving) return
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    setServerError('')
    if (!file) { setServerError(t('openingBalances.import.validation.fileRequired')); return }
    if (!warehouseId) { setServerError(t('openingBalances.import.validation.warehouseRequired')); return }
    if (!date) { setServerError(t('openingBalances.import.validation.dateRequired')); return }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('warehouse_id', warehouseId)
    formData.append('date', date)
    if (notes) formData.append('notes', notes)

    try {
      await onSubmit(formData)
      resetForm()
      onClose()
    } catch (error) {
      setServerError(toAppApiError(error).message)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : closeDialog} fullWidth maxWidth="sm">
      <DialogTitle>{t('openingBalances.import.title')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          {serverError && <Alert severity="error">{serverError}</Alert>}
          <Alert severity="info">{t('openingBalances.import.notice')}</Alert>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadOutlined />}
              disabled={isSaving}
            >
              {file ? file.name : t('openingBalances.import.chooseFile')}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            <Button
              variant="text"
              size="small"
              startIcon={<SaveOutlined />}
              component="a"
              href="/api/v1/inventory/opening-balances/import/template"
              target="_blank"
            >
              {t('openingBalances.import.downloadTemplate')}
            </Button>
          </Box>

          <Autocomplete
            options={warehouses}
            value={warehouses.find((w) => w.id === warehouseId) ?? null}
            loading={isLoadingOptions}
            getOptionLabel={(w) => [w.name, w.code, w.branch_name].filter(Boolean).join(' / ')}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={isLoadingOptions || isSaving}
            onChange={(_, w) => setWarehouseId(w?.id ?? '')}
            renderInput={(params) => (
              <TextField {...params} label={t('openingBalances.fields.warehouse')} required />
            )}
          />

          <AppDatePicker
            value={date}
            onChange={(v) => setDate(v ?? '')}
            label={t('openingBalances.fields.date')}
            required
          />

          <TextField
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            label={t('openingBalances.fields.notes')}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={closeDialog} disabled={isSaving}>{t('common:buttons.cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSaving || !file}>
          {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.import')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function StockOpeningBalancesPage() {
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
  const [importOpen, setImportOpen] = useState(false)
  const [viewingBalance, setViewingBalance] = useState<StockOpeningBalance | null>(null)
  const dateFormat = useAppDateFormat()
  const canCreate = can('inventory.adjust')

  const filters: StockOpeningBalanceFilters = useMemo(() => ({
    search: search || undefined,
    warehouse_id: warehouseFilter || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page: page + 1,
    per_page: perPage,
  }), [dateFrom, dateTo, page, perPage, search, warehouseFilter])

  const optionsQuery = useInventoryOptionsQuery()
  const balancesQuery = useStockOpeningBalancesQuery(filters)
  const createBalance = useCreateStockOpeningBalanceMutation()
  const importBalance = useImportStockOpeningBalanceMutation()
  const detailQuery = useStockOpeningBalanceQuery(viewingBalance?.id ?? null)
  const balances = balancesQuery.data?.data ?? []
  const warehouses = optionsQuery.data?.warehouses ?? []
  const meta = balancesQuery.data?.meta
  const selectedBalance = detailQuery.data ?? viewingBalance

  const handleSubmit = async (payload: StockOpeningBalancePayload) => {
    await createBalance.mutateAsync(payload)
    enqueueSnackbar(t('openingBalances.messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleImport = async (formData: FormData) => {
    const result = await importBalance.mutateAsync(formData)
    if (result.skipped > 0) {
      enqueueSnackbar(t('openingBalances.import.resultPartial', { imported: result.imported, skipped: result.skipped }), { variant: 'warning' })
    } else {
      enqueueSnackbar(t('openingBalances.import.resultSuccess', { count: result.imported }), { variant: 'success' })
    }
    setPage(0)
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Inventory2Outlined color="primary" />
            <Typography variant="h4">{t('openingBalances.title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>{t('openingBalances.subtitle')}</Typography>
        </Box>
        {canCreate && (
          <Stack direction="row" spacing={1}>
            <Button startIcon={<UploadOutlined />} variant="outlined" onClick={() => setImportOpen(true)}>
              {t('openingBalances.actions.import')}
            </Button>
            <Button startIcon={<Add />} variant="contained" onClick={() => setFormOpen(true)}>
              {t('openingBalances.actions.new')}
            </Button>
          </Stack>
        )}
      </Stack>

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', lg: 'center' }, mb: 2.5 }}>
            <TextField
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
              placeholder={t('openingBalances.filters.search')}
              sx={{ flexGrow: 1 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
            />
            <SearchableFilterSelect
              value={warehouseFilter}
              options={warehouses}
              loading={optionsQuery.isLoading}
              label={t('openingBalances.filters.warehouse')}
              placeholder={t('openingBalances.filters.allWarehouses')}
              getOptionValue={(warehouse) => warehouse.id}
              getOptionLabel={(warehouse) => warehouse.name}
              getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')}
              onChange={(value) => {
                setWarehouseFilter(value)
                setPage(0)
              }}
              sx={{ minWidth: { xs: '100%', lg: 240 } }}
            />
            <Box sx={{ minWidth: { xs: '100%', lg: 170 } }}>
              <AppDatePicker value={dateFrom} onChange={(value) => { setDateFrom(value ?? ''); setPage(0) }} label={t('openingBalances.filters.dateFrom')} />
            </Box>
            <Box sx={{ minWidth: { xs: '100%', lg: 170 } }}>
              <AppDatePicker value={dateTo} onChange={(value) => { setDateTo(value ?? ''); setPage(0) }} label={t('openingBalances.filters.dateTo')} />
            </Box>
          </Stack>

          {balancesQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>{toAppApiError(balancesQuery.error).message}</Alert>}
          {optionsQuery.isError && <Alert severity="error" sx={{ mb: 2 }}>{toAppApiError(optionsQuery.error).message}</Alert>}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('openingBalances.columns.reference')}</TableCell>
                  <TableCell>{t('openingBalances.columns.date')}</TableCell>
                  <TableCell>{t('openingBalances.columns.warehouse')}</TableCell>
                  <TableCell>{t('openingBalances.columns.items')}</TableCell>
                  <TableCell>{t('openingBalances.columns.createdBy')}</TableCell>
                  <TableCell align="center">{t('openingBalances.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {balancesQuery.isLoading && <TableStateRow colSpan={6} loading />}
                {!balancesQuery.isLoading && balances.length === 0 && <TableStateRow colSpan={6} message={t('openingBalances.empty')} />}
                {balances.map((balance) => (
                  <TableRow key={balance.id} hover>
                    <TableCell><Typography variant="subtitle2">{balance.reference_no}</Typography></TableCell>
                    <TableCell>{formatAppDate(balance.date, dateFormat, i18n.language)}</TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{balance.warehouse?.name ?? '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{balance.warehouse?.branch_name ?? '-'}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{balance.items?.length ?? 0}</TableCell>
                    <TableCell>{balance.creator?.name || '-'}</TableCell>
                    <TableCell align="center">
                      <RowActions
                        viewLabel={t('openingBalances.actions.view')}
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showView
                        showEdit={false}
                        showDelete={false}
                        onView={() => setViewingBalance(balance)}
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

      <OpeningBalanceDialog
        open={formOpen}
        warehouses={warehouses}
        isLoadingOptions={optionsQuery.isLoading}
        isSaving={createBalance.isPending}
        onClose={() => {
          if (!createBalance.isPending) setFormOpen(false)
        }}
        onSubmit={handleSubmit}
      />

      <ImportDialog
        open={importOpen}
        warehouses={warehouses}
        isLoadingOptions={optionsQuery.isLoading}
        isSaving={importBalance.isPending}
        onClose={() => {
          if (!importBalance.isPending) setImportOpen(false)
        }}
        onSubmit={handleImport}
      />

      <Dialog open={!!viewingBalance} onClose={() => setViewingBalance(null)} fullWidth maxWidth="md">
        <DialogTitle>{selectedBalance?.reference_no ?? t('openingBalances.detail.title')}</DialogTitle>
        <DialogContent dividers>
          {detailQuery.isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}
          {detailQuery.isError && <Alert severity="error">{toAppApiError(detailQuery.error).message}</Alert>}
          {selectedBalance && !detailQuery.isLoading && (
            <Stack spacing={2.5}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('openingBalances.detail.subtitle')}</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('openingBalances.fields.product')}</TableCell>
                      <TableCell align="right">{t('openingBalances.fields.quantity')}</TableCell>
                      <TableCell align="right">{t('openingBalances.fields.unitCost')}</TableCell>
                      <TableCell>{t('openingBalances.fields.trackedValue')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedBalance.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="body2">{item.product?.name ?? '-'}{item.variation ? ` / ${item.variation.name}` : ''}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.variation?.sku ?? item.product?.sku ?? '-'}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{formatQuantity(item.quantity)}</TableCell>
                        <TableCell align="right">{formatQuantity(item.unit_cost)}</TableCell>
                        <TableCell>{item.lot_number || item.serial_number || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {selectedBalance.notes && <Typography variant="body2" sx={{ color: 'text.secondary' }}>{selectedBalance.notes}</Typography>}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
