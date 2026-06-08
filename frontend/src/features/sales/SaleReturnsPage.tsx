'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useSaleReturnsQuery } from '@/features/sales/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { formatAppDate } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import type { SaleReturnFilters } from '@/types/sales'

const rowsPerPageOptions = [10, 25, 50]

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

      <Card>
        <CardContent>
          {saleReturnsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(saleReturnsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('returns.columns.return')}</TableCell>
                  <TableCell>{t('returns.columns.sale')}</TableCell>
                  <TableCell>{t('columns.branch')}</TableCell>
                  <TableCell>{t('columns.date')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell align="right">{t('returns.columns.items')}</TableCell>
                  <TableCell align="right">{t('columns.total')}</TableCell>
                  <TableCell align="center">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {saleReturnsQuery.isLoading && <TableStateRow colSpan={8} loading />}
                {!saleReturnsQuery.isLoading && saleReturns.length === 0 && (
                  <TableStateRow colSpan={8} message={t('returns.empty')} />
                )}
                {saleReturns.map((saleReturn) => (
                  <TableRow key={saleReturn.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{saleReturn.return_number}</Typography>
                    </TableCell>
                    <TableCell>{saleReturn.sale?.sale_number ?? '-'}</TableCell>
                    <TableCell>{saleReturn.branch?.name ?? '-'}</TableCell>
                    <TableCell>{formatAppDate(saleReturn.return_date, dateFormat, i18n.language)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t(`returns.statuses.${saleReturn.status}`, { defaultValue: saleReturn.status })} variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{saleReturn.items_count.toLocaleString()}</TableCell>
                    <TableCell align="right">{formatMoney(saleReturn.total_amount, currencyFormatter)}</TableCell>
                    <TableCell align="center">
                      <RowActions
                        viewLabel={t('common:buttons.view')}
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showView
                        showEdit={false}
                        showDelete={false}
                        onView={() => router.push(`/sale-returns/${saleReturn.id}`)}
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
    </Stack>
  )
}
