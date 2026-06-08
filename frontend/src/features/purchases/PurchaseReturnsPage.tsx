'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { CompareArrowsOutlined } from '@/components/ui/icons'
import { useBranchesQuery } from '@/features/branches/hooks'
import { usePurchaseReturnsQuery } from '@/features/purchases/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { formatAppDate } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import type { PurchaseReturn, PurchaseReturnFilters } from '@/types/purchase'

export function PurchaseReturnsPage() {
  const { t, i18n } = useTranslation(['purchases', 'common'])
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

  const filters: PurchaseReturnFilters = useMemo(
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

  const purchaseReturnsQuery = usePurchaseReturnsQuery(filters)
  const branchesQuery = useBranchesQuery({ is_active: true, per_page: 100 })
  const warehousesQuery = useWarehousesQuery({ branch_id: branchFilter || undefined, per_page: 100 })
  const purchaseReturns = purchaseReturnsQuery.data?.data ?? []
  const meta = purchaseReturnsQuery.data?.meta
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

  const handleView = (id: string) => {
    router.push(`/purchase-returns/${id}`)
  }

  const columns: EntityTableColumn<PurchaseReturn>[] = useMemo(
    () => [
      {
        key: 'returnNumber',
        label: t('returns.columns.returnNumber'),
        render: (purchaseReturn) => (
          <Typography variant="subtitle2">{purchaseReturn.return_number}</Typography>
        ),
      },
      {
        key: 'poNumber',
        label: t('returns.columns.poNumber'),
        render: (purchaseReturn) => purchaseReturn.purchase?.purchase_number ?? '-',
      },
      {
        key: 'branch',
        label: t('columns.branch'),
        render: (purchaseReturn) => purchaseReturn.branch?.name ?? '-',
      },
      {
        key: 'warehouse',
        label: t('columns.warehouse'),
        render: (purchaseReturn) => purchaseReturn.warehouse?.name ?? '-',
      },
      {
        key: 'date',
        label: t('columns.date'),
        render: (purchaseReturn) => (
          purchaseReturn.return_date ? formatAppDate(purchaseReturn.return_date, dateFormat, i18n.language) : '-'
        ),
      },
      {
        key: 'total',
        label: t('columns.total'),
        align: 'right',
        render: (purchaseReturn) => formatMoney(purchaseReturn.total_amount, currencyFormatter),
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
              onChange={(value) => {
                setWarehouseFilter(value)
                setPage(0)
              }}
              sx={{ minWidth: { xs: '100%', lg: 190 } }}
            />
            <Box sx={{ minWidth: { xs: '100%', lg: 165 } }}>
              <AppDatePicker
                label={t('filters.dateFrom')}
                value={dateFrom}
                onChange={(v) => {
                  setDateFrom(v)
                  setPage(0)
                }}
                maxDate={dateTo}
              />
            </Box>
            <Box sx={{ minWidth: { xs: '100%', lg: 165 } }}>
              <AppDatePicker
                label={t('filters.dateTo')}
                value={dateTo}
                onChange={(v) => {
                  setDateTo(v)
                  setPage(0)
                }}
                minDate={dateFrom}
              />
            </Box>
          </>
        }
      />

      {purchaseReturnsQuery.isError && (
        <Alert severity="error">{toAppApiError(purchaseReturnsQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={purchaseReturns}
        columns={columns}
        getRowKey={(purchaseReturn) => purchaseReturn.id}
        loading={purchaseReturnsQuery.isLoading}
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
        rowActions={(purchaseReturn) => (
          <RowActions
            showView
            viewLabel={t('common:buttons.view')}
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            onView={() => handleView(purchaseReturn.id)}
          />
        )}
      />
    </Stack>
  )
}
