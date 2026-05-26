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
  Collapse,
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
import { Add, ExpandLess, ExpandMore, PointOfSaleOutlined, Search, TuneOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useCustomersQuery } from '@/features/customers/hooks'
import { useDeleteSaleMutation, useSalesQuery } from '@/features/sales/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import type { Sale, SaleFilters, SaleStatus, SaleType } from '@/types/sales'

const rowsPerPageOptions = [10, 25, 50]
const statuses: SaleStatus[] = ['draft', 'quotation', 'suspended', 'confirmed', 'completed', 'cancelled', 'returned']
const saleTypes: SaleType[] = ['invoice', 'pos_sale', 'draft', 'quotation', 'suspended']
const deletableStatuses = ['draft', 'quotation', 'suspended', 'confirmed']

function formatMoney(value: number | string | null | undefined, formatter: Intl.NumberFormat) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? formatter.format(numeric) : '-'
}

export default function SalesPage() {
  const { t, i18n } = useTranslation(['sales', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null)
  const [statusFilter, setStatusFilter] = useState<SaleStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<SaleType | ''>('')
  const [branchFilter, setBranchFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()

  const filters: SaleFilters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      branch_id: branchFilter || undefined,
      warehouse_id: warehouseFilter || undefined,
      customer_id: customerFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [branchFilter, customerFilter, dateFrom, dateTo, page, perPage, search, statusFilter, typeFilter, warehouseFilter]
  )

  const salesQuery = useSalesQuery(filters)
  const deleteSale = useDeleteSaleMutation()
  const branchesQuery = useBranchesQuery({ is_active: true, per_page: 100 })
  const warehousesQuery = useWarehousesQuery({ branch_id: branchFilter || undefined, per_page: 100 })
  const customersQuery = useCustomersQuery({ status: 'active', per_page: 100 })

  const sales = salesQuery.data?.data ?? []
  const meta = salesQuery.data?.meta
  const branches = branchesQuery.data?.data ?? []
  const warehouses = warehousesQuery.data?.data ?? []
  const customers = customersQuery.data?.data ?? []
  const canCreate = can('sales.create')
  const canEdit = can('sales.edit')
  const canDelete = can('sales.delete')
  const activeAdvancedFilterCount = [
    statusFilter,
    typeFilter,
    branchFilter,
    warehouseFilter,
    customerFilter,
    dateFrom,
    dateTo,
  ].filter(Boolean).length
  const filterToggleLabel = `${t(filtersOpen ? 'filters.hideAdvanced' : 'filters.showAdvanced')}${
    activeAdvancedFilterCount > 0 ? ` (${activeAdvancedFilterCount})` : ''
  }`

  const handleDelete = async () => {
    if (!deleteTarget) return

    await deleteSale.mutateAsync(deleteTarget.id)
    enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
    setDeleteTarget(null)
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
            <PointOfSaleOutlined color="primary" />
            <Typography variant="h4">{t('title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('subtitle')}
          </Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/sales/create')}>
            {t('actions.create')}
          </Button>
        )}
      </Stack>

      <Card>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Stack spacing={2} sx={{ mb: 2.5 }}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={2}
              sx={{ alignItems: { xs: 'stretch', lg: 'center' } }}
            >
              <TextField
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(0)
                }}
                placeholder={t('filters.search')}
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
              <Button
                variant="outlined"
                startIcon={<TuneOutlined />}
                endIcon={filtersOpen ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setFiltersOpen((open) => !open)}
                sx={{ minWidth: { xs: '100%', lg: 190 }, justifyContent: 'space-between' }}
              >
                {filterToggleLabel}
              </Button>
            </Stack>
            <Collapse in={filtersOpen} timeout="auto">
              <Stack
                direction={{ xs: 'column', lg: 'row' }}
                spacing={2}
                sx={{
                  alignItems: { xs: 'stretch', lg: 'center' },
                  overflowX: { lg: 'auto' },
                  pt: 0.5,
                  pb: { lg: 0.5 },
                }}
              >
                <TextField
                  select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as SaleStatus | '')
                    setPage(0)
                  }}
                  label={t('filters.status')}
                  sx={{ minWidth: { xs: '100%', lg: 170 } }}
                >
                  <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
                  {statuses.map((status) => (
                    <MenuItem key={status} value={status}>{t(`statuses.${status}`)}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  value={typeFilter}
                  onChange={(event) => {
                    setTypeFilter(event.target.value as SaleType | '')
                    setPage(0)
                  }}
                  label={t('filters.type')}
                  sx={{ minWidth: { xs: '100%', lg: 150 } }}
                >
                  <MenuItem value="">{t('filters.allTypes')}</MenuItem>
                  {saleTypes.map((type) => (
                    <MenuItem key={type} value={type}>{t(`types.${type}`)}</MenuItem>
                  ))}
                </TextField>
                <SearchableFilterSelect
                  value={branchFilter}
                  options={branches}
                  loading={branchesQuery.isLoading}
                  label={t('filters.branch')}
                  placeholder={t('filters.allBranches')}
                  getOptionValue={(branch) => branch.id}
                  getOptionLabel={(branch) => branch.name}
                  getOptionDescription={(branch) => branch.code}
                  onChange={(value) => {
                    setBranchFilter(value)
                    setWarehouseFilter('')
                    setPage(0)
                  }}
                  sx={{ minWidth: { xs: '100%', lg: 190 } }}
                />
                <SearchableFilterSelect
                  value={warehouseFilter}
                  options={warehouses}
                  loading={warehousesQuery.isLoading}
                  label={t('filters.warehouse')}
                  placeholder={t('filters.allWarehouses')}
                  getOptionValue={(warehouse) => warehouse.id}
                  getOptionLabel={(warehouse) => warehouse.name}
                  getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch?.name].filter(Boolean).join(' / ')}
                  onChange={(value) => {
                    setWarehouseFilter(value)
                    setPage(0)
                  }}
                  sx={{ minWidth: { xs: '100%', lg: 190 } }}
                />
                <SearchableFilterSelect
                  value={customerFilter}
                  options={customers}
                  loading={customersQuery.isLoading}
                  label={t('filters.customer')}
                  placeholder={t('filters.allCustomers')}
                  getOptionValue={(customer) => customer.id}
                  getOptionLabel={(customer) => customer.name}
                  getOptionDescription={(customer) => [customer.code, customer.phone || customer.mobile].filter(Boolean).join(' / ')}
                  onChange={(value) => {
                    setCustomerFilter(value)
                    setPage(0)
                  }}
                  sx={{ minWidth: { xs: '100%', lg: 220 } }}
                />
                <Box sx={{ minWidth: { xs: '100%', lg: 165 } }}>
                  <AppDatePicker
                    label={t('filters.dateFrom')}
                    value={dateFrom}
                    onChange={(value) => {
                      setDateFrom(value)
                      setPage(0)
                    }}
                    maxDate={dateTo}
                  />
                </Box>
                <Box sx={{ minWidth: { xs: '100%', lg: 165 } }}>
                  <AppDatePicker
                    label={t('filters.dateTo')}
                    value={dateTo}
                    onChange={(value) => {
                      setDateTo(value)
                      setPage(0)
                    }}
                    minDate={dateFrom}
                  />
                </Box>
              </Stack>
            </Collapse>
          </Stack>

          {salesQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(salesQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.sale')}</TableCell>
                  <TableCell>{t('columns.customer')}</TableCell>
                  <TableCell>{t('columns.branch')}</TableCell>
                  <TableCell>{t('columns.date')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell>{t('columns.payment')}</TableCell>
                  <TableCell align="right">{t('columns.total')}</TableCell>
                  <TableCell align="right">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesQuery.isLoading && <TableStateRow colSpan={8} loading />}
                {!salesQuery.isLoading && sales.length === 0 && (
                  <TableStateRow colSpan={8} message={t('empty')} />
                )}
                {sales.map((sale) => (
                  <TableRow key={sale.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{sale.sale_number}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {t(`types.${sale.type}`, { defaultValue: sale.type })}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{sale.customer?.name ?? '-'}</TableCell>
                    <TableCell>{sale.branch?.name ?? '-'}</TableCell>
                    <TableCell>{formatAppDate(sale.sale_date, dateFormat, i18n.language)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t(`statuses.${sale.status}`, { defaultValue: sale.status })} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={t(`paymentStatuses.${sale.payment_status}`, { defaultValue: sale.payment_status })} variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{formatMoney(sale.total_amount, currencyFormatter)}</TableCell>
                    <TableCell align="right">
                      <RowActions
                        viewLabel={t('common:buttons.view')}
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showView
                        showEdit={canEdit}
                        showDelete={canDelete && deletableStatuses.includes(sale.status)}
                        onView={() => {
                          router.push(`/sales/${sale.id}`)
                        }}
                        onEdit={() => {
                          router.push(sale.type === 'pos_sale' ? `/pos/${sale.id}/edit` : `/sales/${sale.id}/edit`)
                        }}
                        onDelete={() => setDeleteTarget(sale)}
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

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('delete.title')}
        message={t('delete.message', { number: deleteTarget?.sale_number ?? '' })}
        confirmText={t('common:buttons.delete')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteSale.isPending}
        confirmColor="error"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
