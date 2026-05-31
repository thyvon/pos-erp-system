'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
} from '@mui/material'
import { CompareArrowsOutlined, ExpandLess, ExpandMore, Search, TuneOutlined } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { useBranchesQuery } from '@/features/branches/hooks'
import { usePurchaseReturnsQuery } from '@/features/purchases/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { formatAppDate } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import type { PurchaseReturnFilters } from '@/types/purchase'

const rowsPerPageOptions = [10, 25, 50]

export function PurchaseReturnsPage() {
  const { t, i18n } = useTranslation(['purchases', 'common'])
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
  const activeAdvancedFilterCount = [branchFilter, warehouseFilter, dateFrom, dateTo].filter(Boolean).length
  const filterToggleLabel = `${t(filtersOpen ? 'filters.hideAdvanced' : 'filters.showAdvanced')}${
    activeAdvancedFilterCount > 0 ? ` (${activeAdvancedFilterCount})` : ''
  }`

  const handleView = (id: string) => {
    router.push(`/purchase-returns/${id}`)
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
            <CompareArrowsOutlined color="primary" />
            <Typography variant="h4">{t('returns.title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('returns.subtitle')}
          </Typography>
        </Box>
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
                sx={{
                  alignItems: { xs: 'stretch', lg: 'center' },
                  overflowX: { lg: 'auto' },
                  pt: 0.5,
                  pb: { lg: 0.5 },
                }}
              >
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
              </Stack>
            </Collapse>
          </Stack>

          {purchaseReturnsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(purchaseReturnsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('returns.columns.returnNumber')}</TableCell>
                  <TableCell>{t('returns.columns.poNumber')}</TableCell>
                  <TableCell>{t('columns.branch')}</TableCell>
                  <TableCell>{t('columns.warehouse')}</TableCell>
                  <TableCell>{t('columns.date')}</TableCell>
                  <TableCell align="right">{t('columns.total')}</TableCell>
                  <TableCell align="center">{t('common:buttons.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchaseReturnsQuery.isLoading && <TableStateRow colSpan={7} loading />}
                {!purchaseReturnsQuery.isLoading && purchaseReturns.length === 0 && (
                  <TableStateRow colSpan={7} message={t('returns.empty')} />
                )}
                {purchaseReturns.map((purchaseReturn) => (
                  <TableRow key={purchaseReturn.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{purchaseReturn.return_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{purchaseReturn.purchase?.purchase_number ?? '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{purchaseReturn.branch?.name ?? '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{purchaseReturn.warehouse?.name ?? '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {purchaseReturn.return_date ? formatAppDate(purchaseReturn.return_date, dateFormat, i18n.language) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatMoney(purchaseReturn.total_amount, currencyFormatter)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <RowActions
                        showView
                        viewLabel={t('common:buttons.view')}
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        onView={() => handleView(purchaseReturn.id)}
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
