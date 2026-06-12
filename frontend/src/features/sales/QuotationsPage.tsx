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
import { Add, ReceiptLongOutlined } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useCustomersQuery } from '@/features/customers/hooks'
import { useQuotationsQuery } from '@/features/sales/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import type { Sale, SaleFilters, SaleStatus } from '@/types/sales'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'

const quotationStatuses: SaleStatus[] = ['quotation', 'converted', 'cancelled']

export function QuotationsPage() {
  const { t, i18n } = useTranslation(['sales', 'common'])
  const router = useRouter()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SaleStatus | ''>('')
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
      branch_id: branchFilter || undefined,
      warehouse_id: warehouseFilter || undefined,
      customer_id: customerFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [branchFilter, customerFilter, dateFrom, dateTo, page, perPage, search, statusFilter, warehouseFilter],
  )

  const quotationsQuery = useQuotationsQuery(filters)
  const branchesQuery = useBranchesQuery({ is_active: true, per_page: 100 })
  const warehousesQuery = useWarehousesQuery({ branch_id: branchFilter || undefined, per_page: 100 })
  const customersQuery = useCustomersQuery({ status: 'active', per_page: 100 })
  const quotations = quotationsQuery.data?.data ?? []
  const meta = quotationsQuery.data?.meta
  const branches = branchesQuery.data?.data ?? []
  const warehouses = warehousesQuery.data?.data ?? []
  const customers = customersQuery.data?.data ?? []
  const canCreate = can('sales.create')

  const clearFilters = () => {
    setStatusFilter('')
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
        key: 'quotation',
        label: t('quotations.columns.quotation'),
        render: (quotation) => <Typography variant="subtitle2">{quotation.sale_number}</Typography>,
      },
      {
        key: 'customer',
        label: t('columns.customer'),
        render: (quotation) => quotation.customer?.name ?? t('labels.walkInCustomer'),
      },
      {
        key: 'branch',
        label: t('columns.branch'),
        render: (quotation) => quotation.branch?.name ?? '-',
      },
      {
        key: 'date',
        label: t('columns.date'),
        render: (quotation) => formatAppDate(quotation.sale_date, dateFormat, i18n.language),
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (quotation) => (
          <Chip
            size="small"
            label={t(`statuses.${quotation.status}`, { defaultValue: quotation.status })}
            variant="outlined"
          />
        ),
      },
      {
        key: 'items',
        label: t('detail.summary.items'),
        align: 'right',
        render: (quotation) => (quotation.items_count ?? quotation.items?.length ?? 0).toLocaleString(),
      },
      {
        key: 'total',
        label: t('columns.total'),
        align: 'right',
        render: (quotation) => formatMoney(quotation.total_amount, currencyFormatter),
      },
    ],
    [currencyFormatter, dateFormat, i18n.language, t],
  )

  const openQuotation = (quotation: Sale) => {
    router.push(`/quotations/${quotation.id}`)
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={t('quotations.title')}
        description={t('quotations.subtitle')}
        actions={canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/quotations/create')}>
            {t('quotations.actions.create')}
          </Button>
        )}
      />

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('quotations.filters.search')}
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
              sx={{ minWidth: { xs: '100%', lg: 180 } }}
            >
              <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
              {quotationStatuses.map((status) => (
                <MenuItem key={status} value={status}>{t(`statuses.${status}`, { defaultValue: status })}</MenuItem>
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

      {quotationsQuery.isError && (
        <Alert severity="error">
          {toAppApiError(quotationsQuery.error).message}
        </Alert>
      )}

      <EntityTable
        rows={quotations}
        columns={columns}
        getRowKey={(quotation) => quotation.id}
        loading={quotationsQuery.isLoading}
        emptyIcon={<ReceiptLongOutlined />}
        emptyTitle={t('quotations.empty')}
        emptyDescription={t('quotations.emptyDescription')}
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
        rowActions={(quotation) => (
          <RowActions
            viewLabel={t('common:buttons.view')}
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showView
            showEdit={false}
            showDelete={false}
            onView={() => openQuotation(quotation)}
          />
        )}
      />
    </Stack>
  )
}
