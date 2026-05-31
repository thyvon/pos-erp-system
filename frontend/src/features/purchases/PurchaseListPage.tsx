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
import { Add, ExpandLess, ExpandMore, LocalShippingOutlined, Search, TuneOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useSuppliersQuery } from '@/features/suppliers/hooks'
import { useDeletePurchaseMutation, usePurchasesQuery } from './hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import type { Purchase, PurchaseFilters, PurchaseStatus, PurchasePaymentStatus } from '@/types/purchase'

const rowsPerPageOptions = [10, 25, 50]
const statuses: PurchaseStatus[] = ['draft', 'confirmed', 'partially_received', 'received', 'cancelled']
const paymentStatuses: PurchasePaymentStatus[] = ['unpaid', 'partial', 'paid']
const deletableStatuses: PurchaseStatus[] = ['draft', 'confirmed', 'cancelled']

export default function PurchasesPage() {
  const { t, i18n } = useTranslation(['purchases', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Purchase | null>(null)
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | ''>('')
  const [paymentFilter, setPaymentFilter] = useState<PurchasePaymentStatus | ''>('')
  const [branchFilter, setBranchFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()

  const filters: PurchaseFilters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter || undefined,
      payment_status: paymentFilter || undefined,
      branch_id: branchFilter || undefined,
      warehouse_id: warehouseFilter || undefined,
      supplier_id: supplierFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [branchFilter, dateFrom, dateTo, page, paymentFilter, perPage, search, statusFilter, supplierFilter, warehouseFilter],
  )

  const purchasesQuery = usePurchasesQuery(filters)
  const deletePurchase = useDeletePurchaseMutation()
  const branchesQuery = useBranchesQuery({ is_active: true, per_page: 100 })
  const warehousesQuery = useWarehousesQuery({ branch_id: branchFilter || undefined, per_page: 100 })
  const suppliersQuery = useSuppliersQuery({ per_page: 100 })

  const purchases = purchasesQuery.data?.data ?? []
  const meta = purchasesQuery.data?.meta
  const branches = branchesQuery.data?.data ?? []
  const warehouses = warehousesQuery.data?.data ?? []
  const suppliers = suppliersQuery.data?.data ?? []
  const canCreate = can('purchases.create')
  const canEdit = can('purchases.edit')
  const canDelete = can('purchases.delete')
  const activeAdvancedFilterCount = [
    statusFilter, paymentFilter, branchFilter, warehouseFilter,
    supplierFilter, dateFrom, dateTo,
  ].filter(Boolean).length
  const filterToggleLabel = `${t(filtersOpen ? 'filters.hideAdvanced' : 'filters.showAdvanced')}${
    activeAdvancedFilterCount > 0 ? ` (${activeAdvancedFilterCount})` : ''
  }`

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deletePurchase.mutateAsync(deleteTarget.id)
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
            <LocalShippingOutlined color="primary" />
            <Typography variant="h4">{t('title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('subtitle')}
          </Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/purchases/create')}>
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
                    setStatusFilter(event.target.value as PurchaseStatus | '')
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
                  value={paymentFilter}
                  onChange={(event) => {
                    setPaymentFilter(event.target.value as PurchasePaymentStatus | '')
                    setPage(0)
                  }}
                  label={t('filters.paymentStatus')}
                  sx={{ minWidth: { xs: '100%', lg: 170 } }}
                >
                  <MenuItem value="">{t('filters.allPaymentStatuses')}</MenuItem>
                  {paymentStatuses.map((status) => (
                    <MenuItem key={status} value={status}>{t(`paymentStatuses.${status}`)}</MenuItem>
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
                  value={supplierFilter}
                  options={suppliers}
                  loading={suppliersQuery.isLoading}
                  label={t('filters.supplier')}
                  placeholder={t('filters.allSuppliers')}
                  getOptionValue={(supplier) => supplier.id}
                  getOptionLabel={(supplier) => supplier.name}
                  getOptionDescription={(supplier) => [supplier.code, supplier.company].filter(Boolean).join(' / ')}
                  onChange={(value) => {
                    setSupplierFilter(value)
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

          {purchasesQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(purchasesQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.po')}</TableCell>
                  <TableCell>{t('columns.supplier')}</TableCell>
                  <TableCell>{t('columns.branch')}</TableCell>
                  <TableCell>{t('columns.date')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell>{t('columns.payment')}</TableCell>
                  <TableCell align="right">{t('columns.total')}</TableCell>
                  <TableCell align="center">{t('common:buttons.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchasesQuery.isLoading && <TableStateRow colSpan={8} loading />}
                {!purchasesQuery.isLoading && purchases.length === 0 && (
                  <TableStateRow colSpan={8} message={t('empty')} />
                )}
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{purchase.purchase_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{purchase.supplier?.name ?? '-'}</Typography>
                        {purchase.supplier?.company && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {purchase.supplier.company}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{purchase.branch?.name ?? '-'}</TableCell>
                    <TableCell>{formatAppDate(purchase.purchase_date, dateFormat, i18n.language)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t(`statuses.${purchase.status}`, { defaultValue: purchase.status })} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={t(`paymentStatuses.${purchase.payment_status}`, { defaultValue: purchase.payment_status })} variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{formatMoney(purchase.total_amount, currencyFormatter)}</TableCell>
                    <TableCell align="center">
                      <RowActions
                        viewLabel={t('common:buttons.view')}
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showView
                        showEdit={canEdit}
                        showDelete={canDelete && deletableStatuses.includes(purchase.status)}
                        onView={() => router.push(`/purchases/${purchase.id}`)}
                        onEdit={() => router.push(`/purchases/${purchase.id}/edit`)}
                        onDelete={() => setDeleteTarget(purchase)}
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
        message={t('delete.message', { number: deleteTarget?.purchase_number ?? '' })}
        confirmText={t('common:buttons.delete')}
        cancelText={t('common:buttons.cancel')}
        loading={deletePurchase.isPending}
        confirmColor="error"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
