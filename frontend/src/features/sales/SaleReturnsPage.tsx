'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
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
  Typography,
  Button,
} from '@mui/material'
import { CompareArrowsOutlined, ExpandLess, ExpandMore, Search, TuneOutlined } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
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
import type { SaleReturnFilters } from '@/types/sales'

const rowsPerPageOptions = [10, 25, 50]

function formatMoney(value: number | string | null | undefined, formatter: Intl.NumberFormat) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? formatter.format(numeric) : '-'
}

export function SaleReturnsPage() {
  const { t, i18n } = useTranslation(['sales', 'common'])
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
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
  const activeAdvancedFilterCount = [branchFilter, warehouseFilter, dateFrom, dateTo].filter(Boolean).length
  const filterToggleLabel = `${t(filtersOpen ? 'filters.hideAdvanced' : 'filters.showAdvanced')}${
    activeAdvancedFilterCount > 0 ? ` (${activeAdvancedFilterCount})` : ''
  }`

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CompareArrowsOutlined color="primary" />
          <Typography variant="h4">{t('returns.title')}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
          {t('returns.subtitle')}
        </Typography>
      </Box>

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
                placeholder={t('returns.filters.search')}
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
                sx={{ alignItems: { xs: 'stretch', lg: 'center' }, overflowX: { lg: 'auto' }, pt: 0.5 }}
              >
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
              </Stack>
            </Collapse>
          </Stack>

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
                  <TableCell align="right">{t('columns.actions')}</TableCell>
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
                    <TableCell align="right">
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
