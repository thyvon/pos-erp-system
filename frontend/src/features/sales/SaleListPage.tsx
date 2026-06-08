'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Add, PointOfSaleOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useCustomersQuery } from '@/features/customers/hooks'
import { useDeleteSaleMutation, useSalesQuery } from '@/features/sales/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import type { Sale, SaleFilters, SaleStatus, SaleType } from '@/types/sales'

const saleStatuses: SaleStatus[] = ['quotation', 'confirmed', 'partially_shipped', 'shipped', 'completed', 'cancelled']
const saleTypes: SaleType[] = ['quotation', 'invoice', 'pos_sale']
const deletableStatuses: SaleStatus[] = ['quotation', 'confirmed']

export default function SaleListPage() {
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

  const clearFilters = () => {
    setStatusFilter('')
    setTypeFilter('')
    setBranchFilter('')
    setWarehouseFilter('')
    setCustomerFilter('')
    setDateFrom(null)
    setDateTo(null)
    setPage(0)
  }

  const activeFilters = [
    statusFilter
      ? {
          key: 'status',
          label: `${t('filters.status')}: ${t(`statuses.${statusFilter}`, { defaultValue: statusFilter })}`,
          onDelete: () => {
            setStatusFilter('')
            setPage(0)
          },
        }
      : null,
    typeFilter
      ? {
          key: 'type',
          label: `${t('filters.type')}: ${t(`types.${typeFilter}`, { defaultValue: typeFilter })}`,
          onDelete: () => {
            setTypeFilter('')
            setPage(0)
          },
        }
      : null,
    branchFilter
      ? {
          key: 'branch',
          label: `${t('filters.branch')}: ${branches.find((branch) => branch.id === branchFilter)?.name ?? branchFilter}`,
          onDelete: () => {
            setBranchFilter('')
            setWarehouseFilter('')
            setPage(0)
          },
        }
      : null,
    warehouseFilter
      ? {
          key: 'warehouse',
          label: `${t('filters.warehouse')}: ${
            warehouses.find((warehouse) => warehouse.id === warehouseFilter)?.name ?? warehouseFilter
          }`,
          onDelete: () => {
            setWarehouseFilter('')
            setPage(0)
          },
        }
      : null,
    customerFilter
      ? {
          key: 'customer',
          label: `${t('filters.customer')}: ${
            customers.find((customer) => customer.id === customerFilter)?.name ?? customerFilter
          }`,
          onDelete: () => {
            setCustomerFilter('')
            setPage(0)
          },
        }
      : null,
    dateFrom
      ? {
          key: 'dateFrom',
          label: `${t('filters.dateFrom')}: ${dateFrom}`,
          onDelete: () => {
            setDateFrom(null)
            setPage(0)
          },
        }
      : null,
    dateTo
      ? {
          key: 'dateTo',
          label: `${t('filters.dateTo')}: ${dateTo}`,
          onDelete: () => {
            setDateTo(null)
            setPage(0)
          },
        }
      : null,
  ].filter((filter): filter is { key: string; label: string; onDelete: () => void } => Boolean(filter))

  const columns = useMemo<EntityTableColumn<Sale>[]>(
    () => [
      {
        key: 'sale',
        label: t('columns.sale'),
        render: (sale) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{sale.sale_number}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t(`types.${sale.type}`, { defaultValue: sale.type })}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'customer',
        label: t('columns.customer'),
        render: (sale) => sale.customer?.name ?? '-',
      },
      {
        key: 'branch',
        label: t('columns.branch'),
        render: (sale) => sale.branch?.name ?? '-',
      },
      {
        key: 'date',
        label: t('columns.date'),
        render: (sale) => formatAppDate(sale.sale_date, dateFormat, i18n.language),
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (sale) => (
          <Chip
            size="small"
            label={t(`statuses.${sale.status}`, { defaultValue: sale.status })}
            variant="outlined"
          />
        ),
      },
      {
        key: 'payment',
        label: t('columns.payment'),
        render: (sale) => (
          <Chip
            size="small"
            label={t(`paymentStatuses.${sale.payment_status}`, { defaultValue: sale.payment_status })}
            variant="outlined"
          />
        ),
      },
      {
        key: 'total',
        label: t('columns.total'),
        align: 'right',
        render: (sale) => formatMoney(sale.total_amount, currencyFormatter),
      },
    ],
    [currencyFormatter, dateFormat, i18n.language, t]
  )

  const handleDelete = async () => {
    if (!deleteTarget) return

    await deleteSale.mutateAsync(deleteTarget.id)
    enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
    setDeleteTarget(null)
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/sales/create')}>
            {t('actions.create')}
          </Button>
        )}
      />

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('filters.search')}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(0)
        }}
        filterButtonLabel={t('filters.showAdvanced')}
        clearFiltersLabel={t('filters.clear')}
        activeFilters={activeFilters}
        onClearFilters={activeFilters.length > 0 ? clearFilters : undefined}
        filters={
          <>
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
              {saleStatuses.map((status) => (
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
          </>
        }
      />

      {salesQuery.isError && (
        <Alert severity="error">
          {toAppApiError(salesQuery.error).message}
        </Alert>
      )}

      <EntityTable
        rows={sales}
        columns={columns}
        getRowKey={(sale) => sale.id}
        loading={salesQuery.isLoading}
        emptyIcon={<PointOfSaleOutlined />}
        emptyTitle={t('empty')}
        emptyDescription={t('emptyDescription')}
        pagination={{
          page,
          rowsPerPage: perPage,
          count: meta?.total ?? 0,
          onPageChange: setPage,
          onRowsPerPageChange: (nextPerPage) => {
            setPerPage(nextPerPage)
            setPage(0)
          },
        }}
        rowActions={(sale) => (
          <RowActions
            viewLabel={t('common:buttons.view')}
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showView
            showEdit={canEdit}
            showDelete={canDelete && deletableStatuses.includes(sale.status)}
            deleteDisabled={deleteSale.isPending}
            onView={() => {
              router.push(`/sales/${sale.id}`)
            }}
            onEdit={() => {
              router.push(sale.type === 'pos_sale' ? `/pos/${sale.id}/edit` : `/sales/${sale.id}/edit`)
            }}
            onDelete={() => setDeleteTarget(sale)}
          />
        )}
      />

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
