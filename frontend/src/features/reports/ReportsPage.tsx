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
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { ExpandLess, ExpandMore, Search, TrendingUpOutlined, TuneOutlined } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { useChartOfAccountsQuery, usePaymentAccountsQuery } from '@/features/accounting/hooks'
import { useBranchesQuery } from '@/features/branches/hooks'
import { useCategoriesQuery } from '@/features/categories/hooks'
import { useCustomersQuery } from '@/features/customers/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useCashRegistersQuery } from '@/features/sales/hooks'
import { useSuppliersQuery } from '@/features/suppliers/hooks'
import { useUsersQuery } from '@/features/users/hooks'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { useAuthStore } from '@/stores/authStore'
import { ReportSummaryCards } from './components/ReportSummaryCards'
import {
  CashRegistersReportTable,
  ExpensesReportTable,
  PurchasePaymentsReportTable,
  PurchaseReturnsReportTable,
  PurchasesReportTable,
  SalePaymentsReportTable,
  SalesReportTable,
  SalesReturnReportTable,
  StockReportTable,
} from './components/ReportTables'
import {
  useCashRegistersReportQuery,
  useExpensesReportQuery,
  usePurchasePaymentsReportQuery,
  usePurchaseReturnsReportQuery,
  usePurchasesReportQuery,
  useSalePaymentsReportQuery,
  useSalesReportQuery,
  useSalesReturnReportQuery,
  useStockReportQuery,
} from './hooks'
import {
  cashRegisterStatuses,
  expensePaymentMethods,
  paymentMethods,
  paymentRecordStatuses,
  paymentStatuses,
  purchasePaymentStatuses,
  purchaseStatuses,
  refundMethods,
  reportTypes,
  rowsPerPageOptions,
  saleReturnStatuses,
  saleStatuses,
  saleTypes,
  stockModes,
  type ReportType,
} from './reportConfig'
import type { ChartOfAccount, PaymentAccount } from '@/types/accounting'
import type { Branch } from '@/types/branch'
import type { Category } from '@/types/category'
import type { Customer } from '@/types/customer'
import type {
  CashRegistersReportFilters,
  ExpensesReportFilters,
  PurchaseReturnsReportFilters,
  PurchasesReportFilters,
  PurchasePaymentsReportFilters,
  SalePaymentsReportFilters,
  SalesReportFilters,
  SalesReturnReportFilters,
  StockReportFilters,
} from '@/types/report'
import type { Warehouse } from '@/types/warehouse'
import type { Supplier } from '@/types/supplier'
import type { CashRegister } from '@/types/sales'
import type { UserListItem } from '@/types/user'

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
  const [categoryFilter, setCategoryFilter] = useState('')
  const [expenseAccountFilter, setExpenseAccountFilter] = useState('')
  const [cashRegisterFilter, setCashRegisterFilter] = useState('')
  const [stockMode, setStockMode] = useState('all')
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
  const canLoadCashRegisters = can('sales.index')

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

  const stockFilters: StockReportFilters = useMemo(
    () => ({
      search: search || undefined,
      branch_id: branchFilter || undefined,
      warehouse_id: warehouseFilter || undefined,
      category_id: categoryFilter || undefined,
      mode: (stockMode as StockReportFilters['mode']) || undefined,
      include_lots: true,
      page: page + 1,
      per_page: perPage,
    }),
    [search, branchFilter, warehouseFilter, categoryFilter, stockMode, page, perPage],
  )

  const expensesFilters: ExpensesReportFilters = useMemo(
    () => ({
      search: search || undefined,
      branch_id: branchFilter || undefined,
      expense_account_id: expenseAccountFilter || undefined,
      payment_account_id: paymentAccountFilter || undefined,
      cashier_id: cashierFilter || undefined,
      payment_method: paymentMethodFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [
      search,
      branchFilter,
      expenseAccountFilter,
      paymentAccountFilter,
      cashierFilter,
      paymentMethodFilter,
      dateFrom,
      dateTo,
      page,
      perPage,
    ],
  )

  const cashRegistersFilters: CashRegistersReportFilters = useMemo(
    () => ({
      search: search || undefined,
      status: (status as CashRegistersReportFilters['status']) || undefined,
      branch_id: branchFilter || undefined,
      cash_register_id: cashRegisterFilter || undefined,
      cashier_id: cashierFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [search, status, branchFilter, cashRegisterFilter, cashierFilter, dateFrom, dateTo, page, perPage],
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
  const stockReportQuery = useStockReportQuery(stockFilters, reportType === 'stock')
  const expensesReportQuery = useExpensesReportQuery(expensesFilters, reportType === 'expenses')
  const cashRegistersReportQuery = useCashRegistersReportQuery(
    cashRegistersFilters,
    reportType === 'cashRegisters',
  )
  const branchesQuery = useBranchesQuery({ is_active: true, per_page: 100 })
  const warehousesQuery = useWarehousesQuery({ branch_id: branchFilter || undefined, per_page: 100 })
  const customersQuery = useCustomersQuery({ per_page: 100 })
  const suppliersQuery = useSuppliersQuery({ status: 'active', per_page: 100 })
  const categoriesQuery = useCategoriesQuery({ per_page: 100 })
  const expenseAccountsQuery = useChartOfAccountsQuery(
    { type: 'expense', status: 'active', per_page: 200 },
    reportType === 'expenses' && canLoadPaymentAccounts,
  )
  const cashRegistersQuery = useCashRegistersQuery(
    { branch_id: branchFilter || undefined, status: 'active', per_page: 200 },
    reportType === 'cashRegisters' && canLoadCashRegisters,
  )
  const paymentAccountsQuery = usePaymentAccountsQuery(
    { status: 'active', per_page: 200 },
    (reportType === 'salePayments' || reportType === 'purchasePayments' || reportType === 'expenses') &&
      canLoadPaymentAccounts,
  )
  const cashiersQuery = useUsersQuery(
    { status: 'active', per_page: 100 },
    (reportType === 'salePayments' ||
      reportType === 'purchasePayments' ||
      reportType === 'expenses' ||
      reportType === 'cashRegisters') &&
      canLoadUsers,
  )
  const salesRows = salesReportQuery.data?.rows ?? []
  const salesReturnRows = salesReturnReportQuery.data?.rows ?? []
  const purchaseRows = purchasesReportQuery.data?.rows ?? []
  const purchaseReturnRows = purchaseReturnsReportQuery.data?.rows ?? []
  const salePaymentRows = salePaymentsReportQuery.data?.rows ?? []
  const purchasePaymentRows = purchasePaymentsReportQuery.data?.rows ?? []
  const stockRows = stockReportQuery.data?.rows ?? []
  const expenseRows = expensesReportQuery.data?.rows ?? []
  const cashRegisterRows = cashRegistersReportQuery.data?.rows ?? []
  const salesSummary = salesReportQuery.data?.summary
  const salesReturnSummary = salesReturnReportQuery.data?.summary
  const purchasesSummary = purchasesReportQuery.data?.summary
  const purchaseReturnsSummary = purchaseReturnsReportQuery.data?.summary
  const salePaymentsSummary = salePaymentsReportQuery.data?.summary
  const purchasePaymentsSummary = purchasePaymentsReportQuery.data?.summary
  const stockSummary = stockReportQuery.data?.summary
  const expensesSummary = expensesReportQuery.data?.summary
  const cashRegistersSummary = cashRegistersReportQuery.data?.summary
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
              : reportType === 'purchasePayments'
                ? purchasePaymentsReportQuery.data?.meta
                : reportType === 'stock'
                  ? stockReportQuery.data?.meta
                  : reportType === 'expenses'
                    ? expensesReportQuery.data?.meta
                    : cashRegistersReportQuery.data?.meta
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
              : reportType === 'purchasePayments'
                ? purchasePaymentsReportQuery
                : reportType === 'stock'
                  ? stockReportQuery
                  : reportType === 'expenses'
                    ? expensesReportQuery
                    : cashRegistersReportQuery
  const statusOptions =
    reportType === 'sales'
      ? saleStatuses
      : reportType === 'salesReturns'
        ? saleReturnStatuses
        : reportType === 'purchases'
        ? purchaseStatuses
        : reportType === 'purchaseReturns'
          ? saleReturnStatuses
          : reportType === 'cashRegisters'
            ? cashRegisterStatuses
            : paymentRecordStatuses
  const paymentStatusOptions = reportType === 'purchases' ? purchasePaymentStatuses : paymentStatuses
  const isPaymentLedgerReport =
    reportType === 'salePayments' || reportType === 'purchasePayments' || reportType === 'expenses'
  const usesCashierFilter = isPaymentLedgerReport || reportType === 'cashRegisters'
  const activeAdvancedFilterCount = [
    reportType !== 'stock' && reportType !== 'expenses' ? status : null,
    reportType === 'sales' ? type : null,
    reportType === 'sales' || reportType === 'purchases' ? paymentStatus : null,
    reportType === 'salesReturns' ? refundMethod : null,
    isPaymentLedgerReport ? paymentMethodFilter : null,
    isPaymentLedgerReport ? paymentAccountFilter : null,
    usesCashierFilter ? cashierFilter : null,
    reportType === 'stock' && stockMode !== 'all' ? stockMode : null,
    reportType === 'stock' ? categoryFilter : null,
    reportType === 'expenses' ? expenseAccountFilter : null,
    reportType === 'cashRegisters' ? cashRegisterFilter : null,
    branchFilter,
    reportType !== 'expenses' && reportType !== 'cashRegisters' ? warehouseFilter : null,
    reportType === 'purchases' || reportType === 'purchaseReturns' || reportType === 'purchasePayments'
      ? supplierFilter
      : reportType === 'stock' || reportType === 'expenses' || reportType === 'cashRegisters'
        ? null
        : customerFilter,
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

      <ReportSummaryCards
        reportType={reportType}
        t={t}
        currencyFormatter={currencyFormatter}
        salesSummary={salesSummary}
        salesReturnSummary={salesReturnSummary}
        purchasesSummary={purchasesSummary}
        purchaseReturnsSummary={purchaseReturnsSummary}
        salePaymentsSummary={salePaymentsSummary}
        purchasePaymentsSummary={purchasePaymentsSummary}
        stockSummary={stockSummary}
        expensesSummary={expensesSummary}
        cashRegistersSummary={cashRegistersSummary}
      />

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
                    setCategoryFilter('')
                    setExpenseAccountFilter('')
                    setCashRegisterFilter('')
                    setStockMode('all')
                    setPaymentAccountFilter('')
                    setCashierFilter('')
                    setPaymentMethodFilter('')
                    setPage(0)
                  }}
                >
                  {reportTypes.map((option) => (
                    <MenuItem key={option} value={option}>
                      {t(`reports.${option}`)}
                    </MenuItem>
                  ))}
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
                            : reportType === 'purchasePayments'
                              ? 'filters.purchasePaymentSearch'
                              : reportType === 'stock'
                                ? 'filters.stockSearch'
                                : reportType === 'expenses'
                                  ? 'filters.expenseSearch'
                                  : 'filters.cashRegisterSearch',
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
                {reportType !== 'stock' && reportType !== 'expenses' && (
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
                )}
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
                {isPaymentLedgerReport && (
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
                      {(reportType === 'expenses' ? expensePaymentMethods : paymentMethods).map((option) => (
                        <MenuItem key={option} value={option}>
                          {t(`paymentMethods.${option}`)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {reportType === 'stock' && (
                  <FormControl sx={{ minWidth: { xs: '100%', lg: 170 } }}>
                    <InputLabel>{t('filters.stockMode')}</InputLabel>
                    <Select
                      value={stockMode}
                      label={t('filters.stockMode')}
                      onChange={(event) => {
                        setStockMode(event.target.value)
                        setPage(0)
                      }}
                    >
                      {stockModes.map((option) => (
                        <MenuItem key={option} value={option}>
                          {t(`stockModes.${option}`)}
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
                    setCashRegisterFilter('')
                    setPage(0)
                  }}
                  sx={{ minWidth: { xs: '100%', lg: 185 } }}
                />
                {reportType !== 'expenses' && reportType !== 'cashRegisters' && (
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
                )}
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
                ) : reportType === 'stock' ? (
                  <SearchableFilterSelect
                    value={categoryFilter}
                    options={categoriesQuery.data?.data ?? []}
                    loading={categoriesQuery.isLoading}
                    label={t('filters.category')}
                    placeholder={t('filters.allCategories')}
                    getOptionValue={(category: Category) => category.id}
                    getOptionLabel={(category: Category) => category.name}
                    onChange={(value) => {
                      setCategoryFilter(value)
                      setPage(0)
                    }}
                    sx={{ minWidth: { xs: '100%', lg: 190 } }}
                  />
                ) : reportType === 'expenses' && canLoadPaymentAccounts ? (
                  <SearchableFilterSelect
                    value={expenseAccountFilter}
                    options={expenseAccountsQuery.data?.data ?? []}
                    loading={expenseAccountsQuery.isLoading}
                    label={t('filters.expenseAccount')}
                    placeholder={t('filters.allExpenseAccounts')}
                    getOptionValue={(account: ChartOfAccount) => account.id}
                    getOptionLabel={(account: ChartOfAccount) => `${account.code} - ${account.name}`}
                    onChange={(value) => {
                      setExpenseAccountFilter(value)
                      setPage(0)
                    }}
                    sx={{ minWidth: { xs: '100%', lg: 230 } }}
                  />
                ) : reportType === 'cashRegisters' && canLoadCashRegisters ? (
                  <SearchableFilterSelect
                    value={cashRegisterFilter}
                    options={cashRegistersQuery.data?.data ?? []}
                    loading={cashRegistersQuery.isLoading}
                    label={t('filters.cashRegister')}
                    placeholder={t('filters.allCashRegisters')}
                    getOptionValue={(register: CashRegister) => register.id}
                    getOptionLabel={(register: CashRegister) => register.name}
                    onChange={(value) => {
                      setCashRegisterFilter(value)
                      setPage(0)
                    }}
                    sx={{ minWidth: { xs: '100%', lg: 210 } }}
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
                {isPaymentLedgerReport && canLoadPaymentAccounts && (
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
                {usesCashierFilter && canLoadUsers && (
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
                {reportType !== 'stock' && (
                  <>
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
                )}
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
          {reportType === 'stock' && (
            <StockReportTable
              rows={stockRows}
              loading={stockReportQuery.isLoading}
              dateFormat={dateFormat}
              language={i18n.language}
              currencyFormatter={currencyFormatter}
              emptyMessage={t('empty.stock')}
              t={t}
            />
          )}
          {reportType === 'expenses' && (
            <ExpensesReportTable
              rows={expenseRows}
              loading={expensesReportQuery.isLoading}
              dateFormat={dateFormat}
              language={i18n.language}
              currencyFormatter={currencyFormatter}
              emptyMessage={t('empty.expenses')}
              t={t}
            />
          )}
          {reportType === 'cashRegisters' && (
            <CashRegistersReportTable
              rows={cashRegisterRows}
              loading={cashRegistersReportQuery.isLoading}
              dateFormat={dateFormat}
              language={i18n.language}
              currencyFormatter={currencyFormatter}
              emptyMessage={t('empty.cashRegisters')}
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
