'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
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
import { ExpandLess, ExpandMore, Search, TrendingUpOutlined, TuneOutlined } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { usePaymentAccountsQuery } from '@/features/accounting/hooks'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useCustomersQuery } from '@/features/customers/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useSuppliersQuery } from '@/features/suppliers/hooks'
import { useUsersQuery } from '@/features/users/hooks'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import {
  usePurchasePaymentsReportQuery,
  usePurchaseReturnsReportQuery,
  usePurchasesReportQuery,
  useSalePaymentsReportQuery,
  useSalesReportQuery,
  useSalesReturnReportQuery,
} from './hooks'
import type { PaymentAccount } from '@/types/accounting'
import type { Branch } from '@/types/branch'
import type { Customer } from '@/types/customer'
import type {
  PurchaseReturnsReportFilters,
  PurchaseReturnsReportRow,
  PurchasesReportFilters,
  PurchasesReportRow,
  PurchasePaymentsReportFilters,
  PurchasePaymentsReportRow,
  SalePaymentsReportFilters,
  SalePaymentsReportRow,
  SalesReportFilters,
  SalesReportRow,
  SalesReturnReportFilters,
  SalesReturnReportRow,
} from '@/types/report'
import type { Warehouse } from '@/types/warehouse'
import type { Supplier } from '@/types/supplier'
import type { UserListItem } from '@/types/user'

type ReportType = 'sales' | 'salesReturns' | 'purchases' | 'purchaseReturns' | 'salePayments' | 'purchasePayments'

const rowsPerPageOptions = [10, 25, 50]
const saleStatuses = ['draft', 'confirmed', 'completed', 'cancelled', 'returned']
const saleReturnStatuses = ['draft', 'completed']
const paymentStatuses = ['unpaid', 'partial', 'paid', 'refunded']
const purchaseStatuses = ['draft', 'confirmed', 'partially_received', 'received', 'cancelled']
const purchasePaymentStatuses = ['unpaid', 'partial', 'paid']
const saleTypes = ['invoice', 'pos_sale', 'draft', 'suspended']
const refundMethods = ['cash', 'credit_note', 'bank_transfer', 'reward_points']
const salePaymentStatuses = ['completed', 'reversed']
const paymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other']

export default function ReportsPage() {
  const { t, i18n } = useTranslation(['reports', 'common'])
  const can = useAuthStore((state) => state.can)
  const [reportType, setReportType] = useState<ReportType>('sales')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [refundMethod, setRefundMethod] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [paymentAccountFilter, setPaymentAccountFilter] = useState('')
  const [cashierFilter, setCashierFilter] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()
  const canLoadUsers = can('users.index')
  const canLoadPaymentAccounts = can('accounting.index')

  const salesFilters: SalesReportFilters = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
      type: type || undefined,
      payment_status: paymentStatus || undefined,
      branch_id: branchFilter || undefined,
      warehouse_id: warehouseFilter || undefined,
      customer_id: customerFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [search, status, type, paymentStatus, branchFilter, warehouseFilter, customerFilter, dateFrom, dateTo, page, perPage],
  )

  const salesReturnFilters: SalesReturnReportFilters = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
      refund_method: refundMethod || undefined,
      branch_id: branchFilter || undefined,
      warehouse_id: warehouseFilter || undefined,
      customer_id: customerFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [search, status, refundMethod, branchFilter, warehouseFilter, customerFilter, dateFrom, dateTo, page, perPage],
  )

  const purchasesFilters: PurchasesReportFilters = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
      payment_status: paymentStatus || undefined,
      branch_id: branchFilter || undefined,
      warehouse_id: warehouseFilter || undefined,
      supplier_id: supplierFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [search, status, paymentStatus, branchFilter, warehouseFilter, supplierFilter, dateFrom, dateTo, page, perPage],
  )

  const purchaseReturnFilters: PurchaseReturnsReportFilters = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
      branch_id: branchFilter || undefined,
      warehouse_id: warehouseFilter || undefined,
      supplier_id: supplierFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [search, status, branchFilter, warehouseFilter, supplierFilter, dateFrom, dateTo, page, perPage],
  )

  const salePaymentFilters: SalePaymentsReportFilters = useMemo(
    () => ({
      search: search || undefined,
      status: (status as SalePaymentsReportFilters['status']) || undefined,
      method: paymentMethodFilter || undefined,
      branch_id: branchFilter || undefined,
      warehouse_id: warehouseFilter || undefined,
      customer_id: customerFilter || undefined,
      payment_account_id: paymentAccountFilter || undefined,
      cashier_id: cashierFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [
      search,
      status,
      paymentMethodFilter,
      branchFilter,
      warehouseFilter,
      customerFilter,
      paymentAccountFilter,
      cashierFilter,
      dateFrom,
      dateTo,
      page,
      perPage,
    ],
  )

  const purchasePaymentFilters: PurchasePaymentsReportFilters = useMemo(
    () => ({
      search: search || undefined,
      status: (status as PurchasePaymentsReportFilters['status']) || undefined,
      method: paymentMethodFilter || undefined,
      branch_id: branchFilter || undefined,
      warehouse_id: warehouseFilter || undefined,
      supplier_id: supplierFilter || undefined,
      payment_account_id: paymentAccountFilter || undefined,
      cashier_id: cashierFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [
      search,
      status,
      paymentMethodFilter,
      branchFilter,
      warehouseFilter,
      supplierFilter,
      paymentAccountFilter,
      cashierFilter,
      dateFrom,
      dateTo,
      page,
      perPage,
    ],
  )

  const salesReportQuery = useSalesReportQuery(salesFilters, reportType === 'sales')
  const salesReturnReportQuery = useSalesReturnReportQuery(salesReturnFilters, reportType === 'salesReturns')
  const purchasesReportQuery = usePurchasesReportQuery(purchasesFilters, reportType === 'purchases')
  const purchaseReturnsReportQuery = usePurchaseReturnsReportQuery(
    purchaseReturnFilters,
    reportType === 'purchaseReturns',
  )
  const salePaymentsReportQuery = useSalePaymentsReportQuery(salePaymentFilters, reportType === 'salePayments')
  const purchasePaymentsReportQuery = usePurchasePaymentsReportQuery(
    purchasePaymentFilters,
    reportType === 'purchasePayments',
  )
  const branchesQuery = useBranchesQuery({ is_active: true, per_page: 100 })
  const warehousesQuery = useWarehousesQuery({ branch_id: branchFilter || undefined, per_page: 100 })
  const customersQuery = useCustomersQuery({ per_page: 100 })
  const suppliersQuery = useSuppliersQuery({ status: 'active', per_page: 100 })
  const paymentAccountsQuery = usePaymentAccountsQuery(
    { status: 'active', per_page: 200 },
    (reportType === 'salePayments' || reportType === 'purchasePayments') && canLoadPaymentAccounts,
  )
  const cashiersQuery = useUsersQuery(
    { status: 'active', per_page: 100 },
    (reportType === 'salePayments' || reportType === 'purchasePayments') && canLoadUsers,
  )
  const salesRows = salesReportQuery.data?.rows ?? []
  const salesReturnRows = salesReturnReportQuery.data?.rows ?? []
  const purchaseRows = purchasesReportQuery.data?.rows ?? []
  const purchaseReturnRows = purchaseReturnsReportQuery.data?.rows ?? []
  const salePaymentRows = salePaymentsReportQuery.data?.rows ?? []
  const purchasePaymentRows = purchasePaymentsReportQuery.data?.rows ?? []
  const salesSummary = salesReportQuery.data?.summary
  const salesReturnSummary = salesReturnReportQuery.data?.summary
  const purchasesSummary = purchasesReportQuery.data?.summary
  const purchaseReturnsSummary = purchaseReturnsReportQuery.data?.summary
  const salePaymentsSummary = salePaymentsReportQuery.data?.summary
  const purchasePaymentsSummary = purchasePaymentsReportQuery.data?.summary
  const meta =
    reportType === 'sales'
      ? salesReportQuery.data?.meta
      : reportType === 'salesReturns'
        ? salesReturnReportQuery.data?.meta
        : reportType === 'purchases'
          ? purchasesReportQuery.data?.meta
          : reportType === 'purchaseReturns'
            ? purchaseReturnsReportQuery.data?.meta
            : reportType === 'salePayments'
              ? salePaymentsReportQuery.data?.meta
              : purchasePaymentsReportQuery.data?.meta
  const activeReportQuery =
    reportType === 'sales'
      ? salesReportQuery
      : reportType === 'salesReturns'
        ? salesReturnReportQuery
        : reportType === 'purchases'
          ? purchasesReportQuery
          : reportType === 'purchaseReturns'
            ? purchaseReturnsReportQuery
            : reportType === 'salePayments'
              ? salePaymentsReportQuery
              : purchasePaymentsReportQuery
  const statusOptions =
    reportType === 'sales'
      ? saleStatuses
      : reportType === 'salesReturns'
        ? saleReturnStatuses
        : reportType === 'purchases'
          ? purchaseStatuses
          : reportType === 'purchaseReturns'
            ? saleReturnStatuses
            : salePaymentStatuses
  const paymentStatusOptions = reportType === 'purchases' ? purchasePaymentStatuses : paymentStatuses
  const activeAdvancedFilterCount = [
    status,
    reportType === 'sales' ? type : null,
    reportType === 'sales' || reportType === 'purchases' ? paymentStatus : null,
    reportType === 'salesReturns' ? refundMethod : null,
    reportType === 'salePayments' || reportType === 'purchasePayments' ? paymentMethodFilter : null,
    reportType === 'salePayments' || reportType === 'purchasePayments' ? paymentAccountFilter : null,
    reportType === 'salePayments' || reportType === 'purchasePayments' ? cashierFilter : null,
    branchFilter,
    warehouseFilter,
    reportType === 'purchases' || reportType === 'purchaseReturns' ? supplierFilter : customerFilter,
    dateFrom,
    dateTo,
  ].filter(Boolean).length
  const filterToggleLabel = `${t(filtersOpen ? 'filters.hideAdvanced' : 'filters.showAdvanced')}${
    activeAdvancedFilterCount > 0 ? ` (${activeAdvancedFilterCount})` : ''
  }`

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <TrendingUpOutlined color="primary" />
          <Typography variant="h4">{t('title')}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
          {t('subtitle')}
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <SummaryCard
          label={t(
            reportType === 'sales'
              ? 'summary.sales'
              : reportType === 'salesReturns'
                ? 'summary.salesReturns'
                : reportType === 'purchases'
                  ? 'summary.purchases'
                  : reportType === 'purchaseReturns'
                    ? 'summary.purchaseReturns'
                    : reportType === 'salePayments'
                      ? 'summary.salePayments'
                      : 'summary.purchasePayments',
          )}
          value={
            reportType === 'sales'
              ? salesSummary?.count ?? 0
              : reportType === 'salesReturns'
                ? salesReturnSummary?.count ?? 0
                : reportType === 'purchases'
                  ? purchasesSummary?.count ?? 0
                  : reportType === 'purchaseReturns'
                    ? purchaseReturnsSummary?.count ?? 0
                    : reportType === 'salePayments'
                      ? salePaymentsSummary?.count ?? 0
                      : purchasePaymentsSummary?.count ?? 0
          }
        />
        <SummaryCard
          label={t(
            reportType === 'sales'
              ? 'summary.total'
              : reportType === 'salesReturns'
                ? 'summary.returnedTotal'
                : reportType === 'purchases'
                  ? 'summary.purchaseTotal'
                  : reportType === 'purchaseReturns'
                    ? 'summary.purchaseReturnedTotal'
                    : reportType === 'salePayments'
                      ? 'summary.collectedTotal'
                      : 'summary.paidOutTotal',
          )}
          value={formatMoney(
            reportType === 'sales'
              ? salesSummary?.total_amount
              : reportType === 'salesReturns'
                ? salesReturnSummary?.total_amount
                : reportType === 'purchases'
                  ? purchasesSummary?.total_amount
                  : reportType === 'purchaseReturns'
                    ? purchaseReturnsSummary?.total_amount
                    : reportType === 'salePayments'
                      ? salePaymentsSummary?.total_amount
                      : purchasePaymentsSummary?.total_amount,
            currencyFormatter,
          )}
        />
        {(reportType === 'sales' || reportType === 'purchases') && (
          <>
            <SummaryCard
              label={t('summary.paid')}
              value={formatMoney(
                reportType === 'sales' ? salesSummary?.paid_amount : purchasesSummary?.paid_amount,
                currencyFormatter,
              )}
            />
            <SummaryCard
              label={t('summary.due')}
              value={formatMoney(
                reportType === 'sales' ? salesSummary?.due_amount : purchasesSummary?.due_amount,
                currencyFormatter,
              )}
            />
          </>
        )}
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={2} sx={{ mb: 2.5 }}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={2}
              sx={{ alignItems: { xs: 'stretch', lg: 'center' } }}
            >
              <FormControl sx={{ minWidth: { xs: '100%', lg: 210 } }}>
                <InputLabel>{t('filters.report')}</InputLabel>
                <Select
                  value={reportType}
                  label={t('filters.report')}
                  onChange={(event) => {
                    setReportType(event.target.value as ReportType)
                    setStatus('')
                    setType('')
                    setPaymentStatus('')
                    setRefundMethod('')
                    setCustomerFilter('')
                    setSupplierFilter('')
                    setPaymentAccountFilter('')
                    setCashierFilter('')
                    setPaymentMethodFilter('')
                    setPage(0)
                  }}
                >
                  <MenuItem value="sales">{t('reports.sales')}</MenuItem>
                  <MenuItem value="salesReturns">{t('reports.salesReturns')}</MenuItem>
                  <MenuItem value="purchases">{t('reports.purchases')}</MenuItem>
                  <MenuItem value="purchaseReturns">{t('reports.purchaseReturns')}</MenuItem>
                  <MenuItem value="salePayments">{t('reports.salePayments')}</MenuItem>
                  <MenuItem value="purchasePayments">{t('reports.purchasePayments')}</MenuItem>
                </Select>
              </FormControl>
              <TextField
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(0)
                }}
                placeholder={t(
                  reportType === 'sales'
                    ? 'filters.search'
                    : reportType === 'salesReturns'
                      ? 'filters.returnSearch'
                      : reportType === 'purchases'
                        ? 'filters.purchaseSearch'
                        : reportType === 'purchaseReturns'
                          ? 'filters.purchaseReturnSearch'
                          : reportType === 'salePayments'
                            ? 'filters.paymentSearch'
                            : 'filters.purchasePaymentSearch',
                )}
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
                sx={{ alignItems: { xs: 'stretch', lg: 'center' }, overflowX: { lg: 'auto' }, py: 0.5 }}
              >
                <FormControl sx={{ minWidth: { xs: '100%', lg: 160 } }}>
                  <InputLabel>{t('filters.status')}</InputLabel>
                  <Select
                    value={status}
                    label={t('filters.status')}
                    onChange={(event) => {
                      setStatus(event.target.value)
                      setPage(0)
                    }}
                  >
                    <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
                    {statusOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {t(`statuses.${option}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {(reportType === 'sales' || reportType === 'purchases') && (
                  <>
                    <FormControl sx={{ minWidth: { xs: '100%', lg: 155 } }}>
                      <InputLabel>{t('filters.paymentStatus')}</InputLabel>
                      <Select
                        value={paymentStatus}
                        label={t('filters.paymentStatus')}
                        onChange={(event) => {
                          setPaymentStatus(event.target.value)
                          setPage(0)
                        }}
                      >
                        <MenuItem value="">{t('filters.allPaymentStatuses')}</MenuItem>
                        {paymentStatusOptions.map((option) => (
                          <MenuItem key={option} value={option}>
                            {t(`paymentStatuses.${option}`)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {reportType === 'sales' && (
                      <FormControl sx={{ minWidth: { xs: '100%', lg: 145 } }}>
                        <InputLabel>{t('filters.type')}</InputLabel>
                        <Select
                          value={type}
                          label={t('filters.type')}
                          onChange={(event) => {
                            setType(event.target.value)
                            setPage(0)
                          }}
                        >
                          <MenuItem value="">{t('filters.allTypes')}</MenuItem>
                          {saleTypes.map((option) => (
                            <MenuItem key={option} value={option}>
                              {t(`types.${option}`)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </>
                )}
                {reportType === 'salesReturns' && (
                  <FormControl sx={{ minWidth: { xs: '100%', lg: 175 } }}>
                    <InputLabel>{t('filters.refundMethod')}</InputLabel>
                    <Select
                      value={refundMethod}
                      label={t('filters.refundMethod')}
                      onChange={(event) => {
                        setRefundMethod(event.target.value)
                        setPage(0)
                      }}
                    >
                      <MenuItem value="">{t('filters.allRefundMethods')}</MenuItem>
                      {refundMethods.map((option) => (
                        <MenuItem key={option} value={option}>
                          {t(`refundMethods.${option}`)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {(reportType === 'salePayments' || reportType === 'purchasePayments') && (
                  <FormControl sx={{ minWidth: { xs: '100%', lg: 175 } }}>
                    <InputLabel>{t('filters.paymentMethod')}</InputLabel>
                    <Select
                      value={paymentMethodFilter}
                      label={t('filters.paymentMethod')}
                      onChange={(event) => {
                        setPaymentMethodFilter(event.target.value)
                        setPage(0)
                      }}
                    >
                      <MenuItem value="">{t('filters.allPaymentMethods')}</MenuItem>
                      {paymentMethods.map((option) => (
                        <MenuItem key={option} value={option}>
                          {t(`paymentMethods.${option}`)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <SearchableFilterSelect
                  value={branchFilter}
                  options={branchesQuery.data?.data ?? []}
                  loading={branchesQuery.isLoading}
                  label={t('filters.branch')}
                  placeholder={t('filters.allBranches')}
                  getOptionValue={(branch: Branch) => branch.id}
                  getOptionLabel={(branch: Branch) => branch.name}
                  onChange={(value) => {
                    setBranchFilter(value)
                    setWarehouseFilter('')
                    setPage(0)
                  }}
                  sx={{ minWidth: { xs: '100%', lg: 185 } }}
                />
                <SearchableFilterSelect
                  value={warehouseFilter}
                  options={warehousesQuery.data?.data ?? []}
                  loading={warehousesQuery.isLoading}
                  label={t('filters.warehouse')}
                  placeholder={t('filters.allWarehouses')}
                  getOptionValue={(warehouse: Warehouse) => warehouse.id}
                  getOptionLabel={(warehouse: Warehouse) => warehouse.name}
                  onChange={(value) => {
                    setWarehouseFilter(value)
                    setPage(0)
                  }}
                  sx={{ minWidth: { xs: '100%', lg: 185 } }}
                />
                {reportType === 'purchases' || reportType === 'purchaseReturns' || reportType === 'purchasePayments' ? (
                  <SearchableFilterSelect
                    value={supplierFilter}
                    options={suppliersQuery.data?.data ?? []}
                    loading={suppliersQuery.isLoading}
                    label={t('filters.supplier')}
                    placeholder={t('filters.allSuppliers')}
                    getOptionValue={(supplier: Supplier) => supplier.id}
                    getOptionLabel={(supplier: Supplier) => supplier.name}
                    onChange={(value) => {
                      setSupplierFilter(value)
                      setPage(0)
                    }}
                    sx={{ minWidth: { xs: '100%', lg: 190 } }}
                  />
                ) : (
                  <SearchableFilterSelect
                    value={customerFilter}
                    options={customersQuery.data?.data ?? []}
                    loading={customersQuery.isLoading}
                    label={t('filters.customer')}
                    placeholder={t('filters.allCustomers')}
                    getOptionValue={(customer: Customer) => customer.id}
                    getOptionLabel={(customer: Customer) => customer.name}
                    onChange={(value) => {
                      setCustomerFilter(value)
                      setPage(0)
                    }}
                    sx={{ minWidth: { xs: '100%', lg: 190 } }}
                  />
                )}
                {(reportType === 'salePayments' || reportType === 'purchasePayments') && canLoadPaymentAccounts && (
                  <SearchableFilterSelect
                    value={paymentAccountFilter}
                    options={paymentAccountsQuery.data?.data ?? []}
                    loading={paymentAccountsQuery.isLoading}
                    label={t('filters.paymentAccount')}
                    placeholder={t('filters.allPaymentAccounts')}
                    getOptionValue={(account: PaymentAccount) => account.id}
                    getOptionLabel={(account: PaymentAccount) => account.name}
                    onChange={(value) => {
                      setPaymentAccountFilter(value)
                      setPage(0)
                    }}
                    sx={{ minWidth: { xs: '100%', lg: 190 } }}
                  />
                )}
                {(reportType === 'salePayments' || reportType === 'purchasePayments') && canLoadUsers && (
                  <SearchableFilterSelect
                    value={cashierFilter}
                    options={cashiersQuery.data?.data ?? []}
                    loading={cashiersQuery.isLoading}
                    label={t('filters.cashier')}
                    placeholder={t('filters.allCashiers')}
                    getOptionValue={(user: UserListItem) => user.id}
                    getOptionLabel={(user: UserListItem) => user.full_name}
                    onChange={(value) => {
                      setCashierFilter(value)
                      setPage(0)
                    }}
                    sx={{ minWidth: { xs: '100%', lg: 190 } }}
                  />
                )}
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

          {activeReportQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(activeReportQuery.error).message}
            </Alert>
          )}

          {reportType === 'sales' && (
            <SalesReportTable
              rows={salesRows}
              loading={salesReportQuery.isLoading}
              dateFormat={dateFormat}
              language={i18n.language}
              currencyFormatter={currencyFormatter}
              emptyMessage={t('empty.sales')}
              t={t}
            />
          )}
          {reportType === 'salesReturns' && (
            <SalesReturnReportTable
              rows={salesReturnRows}
              loading={salesReturnReportQuery.isLoading}
              dateFormat={dateFormat}
              language={i18n.language}
              currencyFormatter={currencyFormatter}
              emptyMessage={t('empty.salesReturns')}
              t={t}
            />
          )}
          {reportType === 'purchases' && (
            <PurchasesReportTable
              rows={purchaseRows}
              loading={purchasesReportQuery.isLoading}
              dateFormat={dateFormat}
              language={i18n.language}
              currencyFormatter={currencyFormatter}
              emptyMessage={t('empty.purchases')}
              t={t}
            />
          )}
          {reportType === 'purchaseReturns' && (
            <PurchaseReturnsReportTable
              rows={purchaseReturnRows}
              loading={purchaseReturnsReportQuery.isLoading}
              dateFormat={dateFormat}
              language={i18n.language}
              currencyFormatter={currencyFormatter}
              emptyMessage={t('empty.purchaseReturns')}
              t={t}
            />
          )}
          {reportType === 'salePayments' && (
            <SalePaymentsReportTable
              rows={salePaymentRows}
              loading={salePaymentsReportQuery.isLoading}
              dateFormat={dateFormat}
              language={i18n.language}
              currencyFormatter={currencyFormatter}
              emptyMessage={t('empty.salePayments')}
              t={t}
            />
          )}
          {reportType === 'purchasePayments' && (
            <PurchasePaymentsReportTable
              rows={purchasePaymentRows}
              loading={purchasePaymentsReportQuery.isLoading}
              dateFormat={dateFormat}
              language={i18n.language}
              currencyFormatter={currencyFormatter}
              emptyMessage={t('empty.purchasePayments')}
              t={t}
            />
          )}
          <TablePagination
            component="div"
            count={meta?.total ?? 0}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={perPage}
            onRowsPerPageChange={(event) => {
              setPerPage(Number(event.target.value))
              setPage(0)
            }}
            rowsPerPageOptions={rowsPerPageOptions}
          />
        </CardContent>
      </Card>
    </Stack>
  )
}

function SummaryCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card sx={{ flex: 1 }}>
      <CardContent>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.75 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

interface ReportTableProps {
  dateFormat: string
  language: string
  currencyFormatter: Intl.NumberFormat
  emptyMessage: string
  loading: boolean
  t: TFunction<['reports', 'common']>
}

function SalesReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: SalesReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.saleNumber')}</TableCell>
            <TableCell>{t('columns.customer')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell>{t('columns.payment')}</TableCell>
            <TableCell align="right">{t('columns.total')}</TableCell>
            <TableCell align="right">{t('columns.paid')}</TableCell>
            <TableCell align="right">{t('columns.due')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={9} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={9} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.sale_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.sale_number}
                </Typography>
              </TableCell>
              <TableCell>{row.customer?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell>{t(`paymentStatuses.${row.payment_status}`, { defaultValue: row.payment_status })}</TableCell>
              <TableCell align="right">{formatMoney(row.total_amount, currencyFormatter)}</TableCell>
              <TableCell align="right">{formatMoney(row.paid_amount, currencyFormatter)}</TableCell>
              <TableCell align="right">{formatMoney(row.due_amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function SalesReturnReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: SalesReturnReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.returnNumber')}</TableCell>
            <TableCell>{t('columns.saleNumber')}</TableCell>
            <TableCell>{t('columns.customer')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell>{t('columns.refundMethod')}</TableCell>
            <TableCell align="right">{t('columns.items')}</TableCell>
            <TableCell align="right">{t('columns.total')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={9} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={9} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.return_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.return_number}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.sale?.sale_number ?? '-'}
                </Typography>
              </TableCell>
              <TableCell>{row.customer?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell>
                {row.refund_method ? t(`refundMethods.${row.refund_method}`, { defaultValue: row.refund_method }) : '-'}
              </TableCell>
              <TableCell align="right">{row.items_count}</TableCell>
              <TableCell align="right">{formatMoney(row.total_amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function PurchasesReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: PurchasesReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.purchaseNumber')}</TableCell>
            <TableCell>{t('columns.supplierInvoice')}</TableCell>
            <TableCell>{t('columns.supplier')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell>{t('columns.payment')}</TableCell>
            <TableCell align="right">{t('columns.total')}</TableCell>
            <TableCell align="right">{t('columns.paid')}</TableCell>
            <TableCell align="right">{t('columns.due')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={10} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={10} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.purchase_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.purchase_number}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.supplier_invoice_no || '-'}
                </Typography>
              </TableCell>
              <TableCell>{row.supplier?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell>{t(`paymentStatuses.${row.payment_status}`, { defaultValue: row.payment_status })}</TableCell>
              <TableCell align="right">{formatMoney(row.total_amount, currencyFormatter)}</TableCell>
              <TableCell align="right">{formatMoney(row.paid_amount, currencyFormatter)}</TableCell>
              <TableCell align="right">{formatMoney(row.due_amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function PurchaseReturnsReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: PurchaseReturnsReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.returnNumber')}</TableCell>
            <TableCell>{t('columns.purchaseNumber')}</TableCell>
            <TableCell>{t('columns.supplier')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell align="right">{t('columns.items')}</TableCell>
            <TableCell align="right">{t('columns.total')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={8} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={8} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.return_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.return_number}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.purchase?.purchase_number ?? '-'}
                </Typography>
              </TableCell>
              <TableCell>{row.supplier?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell align="right">{row.items_count}</TableCell>
              <TableCell align="right">{formatMoney(row.total_amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function SalePaymentsReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: SalePaymentsReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.saleNumber')}</TableCell>
            <TableCell>{t('columns.reference')}</TableCell>
            <TableCell>{t('columns.customer')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.method')}</TableCell>
            <TableCell>{t('columns.account')}</TableCell>
            <TableCell>{t('columns.cashier')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell align="right">{t('columns.amount')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={10} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={10} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.payment_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.sale?.sale_number ?? '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.reference || '-'}
                </Typography>
              </TableCell>
              <TableCell>{row.customer?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`paymentMethods.${row.method}`, { defaultValue: row.method })}</TableCell>
              <TableCell>{row.payment_account?.name ?? '-'}</TableCell>
              <TableCell>{row.cashier?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell align="right">{formatMoney(row.amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function PurchasePaymentsReportTable({
  rows,
  loading,
  dateFormat,
  language,
  currencyFormatter,
  emptyMessage,
  t,
}: ReportTableProps & { rows: PurchasePaymentsReportRow[] }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('columns.date')}</TableCell>
            <TableCell>{t('columns.purchaseNumber')}</TableCell>
            <TableCell>{t('columns.reference')}</TableCell>
            <TableCell>{t('columns.supplier')}</TableCell>
            <TableCell>{t('columns.branch')}</TableCell>
            <TableCell>{t('columns.method')}</TableCell>
            <TableCell>{t('columns.account')}</TableCell>
            <TableCell>{t('columns.cashier')}</TableCell>
            <TableCell>{t('columns.status')}</TableCell>
            <TableCell align="right">{t('columns.amount')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && <TableStateRow colSpan={10} loading />}
          {!loading && rows.length === 0 && <TableStateRow colSpan={10} message={emptyMessage} />}
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{formatAppDate(row.payment_date, dateFormat, language)}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.purchase?.purchase_number ?? '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {row.reference || '-'}
                </Typography>
              </TableCell>
              <TableCell>{row.supplier?.name ?? '-'}</TableCell>
              <TableCell>{row.branch?.name ?? '-'}</TableCell>
              <TableCell>{t(`paymentMethods.${row.method}`, { defaultValue: row.method })}</TableCell>
              <TableCell>{row.payment_account?.name ?? '-'}</TableCell>
              <TableCell>{row.cashier?.name ?? '-'}</TableCell>
              <TableCell>{t(`statuses.${row.status}`, { defaultValue: row.status })}</TableCell>
              <TableCell align="right">{formatMoney(row.amount, currencyFormatter)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
