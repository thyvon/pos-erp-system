'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { CompareArrowsOutlined } from '@/components/ui/icons'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useSaleReturnsQuery } from '@/features/sales/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { formatAppDate } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import type { SaleReturn, SaleReturnFilters } from '@/types/sales'

export function SaleReturnsPage() {
  const { t, i18n } = useTranslation(['sales', 'common'])
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()

  const filters: SaleReturnFilters = useMemo(
    () => ({
      search: search || undefined,
      branch_id: branchFilter || undefined,
      warehouse_id: warehouseFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [branchFilter, dateFrom, dateTo, page, perPage, search, warehouseFilter],
  )

  const saleReturnsQuery = useSaleReturnsQuery(filters)
  const branchesQuery = useBranchesQuery({ is_active: true, per_page: 100 })
  const warehousesQuery = useWarehousesQuery({ branch_id: branchFilter || undefined, per_page: 100 })
  const saleReturns = saleReturnsQuery.data?.data ?? []
  const meta = saleReturnsQuery.data?.meta
  const branches = branchesQuery.data?.data ?? []
  const warehouses = warehousesQuery.data?.data ?? []

  const clearFilters = () => {
    setBranchFilter('')
    setWarehouseFilter('')
    setDateFrom(null)
    setDateTo(null)
    setPage(0)
  }

  const activeFilters = [
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

  const columns = useMemo<EntityTableColumn<SaleReturn>[]>(
    () => [
      {
        key: 'return',
        label: t('returns.columns.return'),
        render: (saleReturn) => <Typography variant="subtitle2">{saleReturn.return_number}</Typography>,
      },
      {
        key: 'sale',
        label: t('returns.columns.sale'),
        render: (saleReturn) => saleReturn.sale?.sale_number ?? '-',
      },
      {
        key: 'branch',
        label: t('columns.branch'),
        render: (saleReturn) => saleReturn.branch?.name ?? '-',
      },
      {
        key: 'date',
        label: t('columns.date'),
        render: (saleReturn) => formatAppDate(saleReturn.return_date, dateFormat, i18n.language),
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (saleReturn) => (
          <Chip
            size="small"
            label={t(`returns.statuses.${saleReturn.status}`, { defaultValue: saleReturn.status })}
            variant="outlined"
          />
        ),
      },
      {
        key: 'items',
        label: t('returns.columns.items'),
        align: 'right',
        render: (saleReturn) => saleReturn.items_count.toLocaleString(),
      },
      {
        key: 'total',
        label: t('columns.total'),
        align: 'right',
        render: (saleReturn) => formatMoney(saleReturn.total_amount, currencyFormatter),
      },
    ],
    [currencyFormatter, dateFormat, i18n.language, t],
  )

  return (
    <Stack spacing={2.5}>
      <PageHeader title={t('returns.title')} description={t('returns.subtitle')} />

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('returns.filters.search')}
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
              sx={{ minWidth: { xs: '100%', lg: 220 } }}
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
              sx={{ minWidth: { xs: '100%', lg: 220 } }}
            />
            <Box sx={{ minWidth: { xs: '100%', lg: 170 } }}>
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
            <Box sx={{ minWidth: { xs: '100%', lg: 170 } }}>
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

      {saleReturnsQuery.isError && (
        <Alert severity="error">
          {toAppApiError(saleReturnsQuery.error).message}
        </Alert>
      )}

      <EntityTable
        rows={saleReturns}
        columns={columns}
        getRowKey={(saleReturn) => saleReturn.id}
        loading={saleReturnsQuery.isLoading}
        emptyIcon={<CompareArrowsOutlined />}
        emptyTitle={t('returns.empty')}
        emptyDescription={t('returns.emptyDescription')}
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
        rowActions={(saleReturn) => (
          <RowActions
            viewLabel={t('common:buttons.view')}
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showView
            showEdit={false}
            showDelete={false}
            onView={() => router.push(`/sale-returns/${saleReturn.id}`)}
          />
        )}
      />
    </Stack>
  )
}
