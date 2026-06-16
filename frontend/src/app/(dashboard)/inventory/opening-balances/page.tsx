'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { FileDownloadOutlined } from '@mui/icons-material'
import { Add, DeleteOutlined, Inventory2Outlined, UploadOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { InventoryProductLookupPicker } from '@/features/inventory/components/InventoryProductLookupPicker'
import { stockOpeningBalancesApi } from '@/features/inventory/api'
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
import { useDefaultWarehouseSelection } from '@/features/warehouses/useDefaultWarehouseSelection'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import type {
  InventoryProductLookupItem,
  InventoryWarehouseOption,
  StockOpeningBalance,
  StockOpeningBalanceFilters,
  StockOpeningBalancePayload,
} from '@/types/inventory'

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
    setValue,
    formState: { errors },
  } = useForm<StockOpeningBalanceFormInput, unknown, StockOpeningBalanceFormValues>({
    resolver: zodResolver(stockOpeningBalanceSchema),
    defaultValues: defaultValues(),
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items', keyName: 'fieldId' })
  const warehouseId = useWatch({ control, name: 'warehouse_id' })
  const watchedItems = useWatch({ control, name: 'items' }) ?? []
  const selectDefaultWarehouse = useCallback((warehouse: InventoryWarehouseOption) => {
    setValue('warehouse_id', warehouse.id, { shouldDirty: false, shouldValidate: true })
  }, [setValue])

  useDefaultWarehouseSelection({
    warehouses,
    warehouseId,
    onWarehouseChange: selectDefaultWarehouse,
    enabled: open,
  })

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
                  {fields.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        {t('openingBalances.emptyItems')}
                      </TableCell>
                    </TableRow>
                  )}
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
  isSaving,
  onClose,
  onSubmit,
}: {
  open: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (file: File) => Promise<void>
}) {
  const { t } = useTranslation(['inventory', 'common'])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const resetForm = () => {
    setErrorMessage('')
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    setFile(selected)
    setErrorMessage('')
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await stockOpeningBalancesApi.downloadImportTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'opening-stock-import-template.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      setErrorMessage(toAppApiError(error).message)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setErrorMessage('')

    try {
      await onSubmit(file)
      resetForm()
      onClose()
    } catch (error) {
      setErrorMessage(toAppApiError(error).message)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('openingBalances.import.title')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 0.5 }}>
          {errorMessage && (
            <FormHelperText error sx={{ m: 0 }}>
              {errorMessage}
            </FormHelperText>
          )}

          <Box>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              {t('openingBalances.import.downloadTemplate')}
            </Button>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
              {t('openingBalances.import.templateHelp')}
            </Typography>
          </Box>

          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              variant="contained"
              startIcon={<UploadOutlined />}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('openingBalances.import.selectFile')}
            </Button>
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {file.name}
              </Typography>
            )}
          </Box>

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('openingBalances.import.fileHelp')}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSaving}>
          {t('common:buttons.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!file || isSaving}
        >
          {isSaving ? <CircularProgress size={20} /> : t('common:buttons.import')}
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

  const handleImport = async (file: File) => {
    const result = await importBalance.mutateAsync(file)
    if (result.skipped > 0) {
      enqueueSnackbar(t('openingBalances.import.result', { imported: result.imported, skipped: result.skipped }), { variant: 'warning' })
    } else {
      enqueueSnackbar(t('openingBalances.import.result', { imported: result.imported, skipped: 0 }), { variant: 'success' })
    }
    setPage(0)
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
        label: `${t('openingBalances.filters.dateFrom')}: ${dateFrom}`,
        onDelete: () => { setDateFrom(''); setPage(0) },
      })
    }
    if (dateTo) {
      chips.push({
        key: 'dateTo',
        label: `${t('openingBalances.filters.dateTo')}: ${dateTo}`,
        onDelete: () => { setDateTo(''); setPage(0) },
      })
    }
    return chips
  }, [warehouseFilter, dateFrom, dateTo, selectedWarehouse, t])

  const columns: EntityTableColumn<StockOpeningBalance>[] = useMemo(() => [
    {
      key: 'reference',
      label: t('openingBalances.columns.reference'),
      render: (balance) => (
        <Typography variant="subtitle2">{balance.reference_no}</Typography>
      ),
    },
    {
      key: 'date',
      label: t('openingBalances.columns.date'),
      render: (balance) => <>{formatAppDate(balance.date, dateFormat, i18n.language)}</>,
    },
    {
      key: 'warehouse',
      label: t('openingBalances.columns.warehouse'),
      render: (balance) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{balance.warehouse?.name ?? '-'}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{balance.warehouse?.branch_name ?? '-'}</Typography>
        </Stack>
      ),
    },
    {
      key: 'items',
      label: t('openingBalances.columns.items'),
      render: (balance) => <>{balance.items?.length ?? 0}</>,
    },
    {
      key: 'createdBy',
      label: t('openingBalances.columns.createdBy'),
      render: (balance) => <>{balance.creator?.name || '-'}</>,
    },
  ], [t, dateFormat, i18n.language])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<Inventory2Outlined color="primary" />}
        title={t('openingBalances.title')}
        description={t('openingBalances.subtitle')}
        actions={canCreate && (
          <Stack direction="row" spacing={1}>
            <Button startIcon={<UploadOutlined />} variant="outlined" onClick={() => setImportOpen(true)}>
              {t('openingBalances.actions.import')}
            </Button>
            <Button startIcon={<Add />} variant="contained" onClick={() => setFormOpen(true)}>
              {t('openingBalances.actions.new')}
            </Button>
          </Stack>
        )}
      />

      {(balancesQuery.isError || optionsQuery.isError) && (
        <Stack spacing={1}>
          {balancesQuery.isError && <Alert severity="error">{toAppApiError(balancesQuery.error).message}</Alert>}
          {optionsQuery.isError && <Alert severity="error">{toAppApiError(optionsQuery.error).message}</Alert>}
        </Stack>
      )}

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('openingBalances.filters.search')}
        onSearchChange={handleSearchChange}
        activeFilters={activeFilters}
        onClearFilters={clearFilters}
        filterButtonLabel={t('openingBalances.filters.warehouse')}
        filters={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <SearchableFilterSelect
              value={warehouseFilter}
              options={warehouses}
              loading={optionsQuery.isLoading}
              label={t('openingBalances.filters.warehouse')}
              placeholder={t('openingBalances.filters.allWarehouses')}
              getOptionValue={(warehouse) => warehouse.id}
              getOptionLabel={(warehouse) => warehouse.name}
              getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')}
              onChange={handleWarehouseChange}
            />
            <AppDatePicker
              value={dateFrom}
              onChange={handleDateFromChange}
              label={t('openingBalances.filters.dateFrom')}
            />
            <AppDatePicker
              value={dateTo}
              onChange={handleDateToChange}
              label={t('openingBalances.filters.dateTo')}
            />
          </Stack>
        }
      />

      <EntityTable
        rows={balances}
        columns={columns}
        getRowKey={(balance) => balance.id}
        loading={balancesQuery.isLoading}
        emptyIcon={<Inventory2Outlined />}
        emptyTitle={t('openingBalances.empty')}
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
        rowActions={(balance) => (
          <RowActions
            viewLabel={t('openingBalances.actions.view')}
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showView
            showEdit={false}
            showDelete={false}
            onView={() => setViewingBalance(balance)}
          />
        )}
      />

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
