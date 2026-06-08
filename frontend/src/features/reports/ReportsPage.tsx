'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TablePagination,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
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
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()
  const canLoadUsers = can('users.index')
  const canLoadPaymentAccounts = can('accounting.index')
  const canLoadCashRegisters = can('sales.index')

  const resetReportScopedFilters = () => {
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
  }

  const clearAdvancedFilters = () => {
    resetReportScopedFilters()
    setBranchFilter('')
    setWarehouseFilter('')
    setDateFrom(null)
    setDateTo(null)
  }

  const resetPageWith = (setter: (value: string) => void, value = '') => {
    setter(value)
    setPage(0)
  }

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
  const searchPlaceholder = t(
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
  )
  const activeFilters = [
    reportType !== 'stock' && reportType !== 'expenses' && status
      ? {
          key: 'status',
          label: `${t('filters.status')}: ${t(`statuses.${status}`, { defaultValue: status })}`,
          onDelete: () => resetPageWith(setStatus),
        }
      : null,
    reportType === 'sales' && type
      ? {
          key: 'type',
          label: `${t('filters.type')}: ${t(`types.${type}`, { defaultValue: type })}`,
          onDelete: () => resetPageWith(setType),
        }
      : null,
    (reportType === 'sales' || reportType === 'purchases') && paymentStatus
      ? {
          key: 'paymentStatus',
          label: `${t('filters.paymentStatus')}: ${t(`paymentStatuses.${paymentStatus}`, { defaultValue: paymentStatus })}`,
          onDelete: () => resetPageWith(setPaymentStatus),
        }
      : null,
    reportType === 'salesReturns' && refundMethod
      ? {
          key: 'refundMethod',
          label: `${t('filters.refundMethod')}: ${t(`refundMethods.${refundMethod}`, { defaultValue: refundMethod })}`,
          onDelete: () => resetPageWith(setRefundMethod),
        }
      : null,
    isPaymentLedgerReport && paymentMethodFilter
      ? {
          key: 'paymentMethod',
          label: `${t('filters.paymentMethod')}: ${t(`paymentMethods.${paymentMethodFilter}`, { defaultValue: paymentMethodFilter })}`,
          onDelete: () => resetPageWith(setPaymentMethodFilter),
        }
      : null,
    isPaymentLedgerReport && paymentAccountFilter
      ? {
          key: 'paymentAccount',
          label: `${t('filters.paymentAccount')}: ${
            paymentAccountsQuery.data?.data.find((account) => account.id === paymentAccountFilter)?.name ?? paymentAccountFilter
          }`,
          onDelete: () => resetPageWith(setPaymentAccountFilter),
        }
      : null,
    usesCashierFilter && cashierFilter
      ? {
          key: 'cashier',
          label: `${t('filters.cashier')}: ${
            cashiersQuery.data?.data.find((cashier) => cashier.id === cashierFilter)?.full_name ?? cashierFilter
          }`,
          onDelete: () => resetPageWith(setCashierFilter),
        }
      : null,
    reportType === 'stock' && stockMode !== 'all'
      ? {
          key: 'stockMode',
          label: `${t('filters.stockMode')}: ${t(`stockModes.${stockMode}`, { defaultValue: stockMode })}`,
          onDelete: () => {
            setStockMode('all')
            setPage(0)
          },
        }
      : null,
    reportType === 'stock' && categoryFilter
      ? {
          key: 'category',
          label: `${t('filters.category')}: ${
            categoriesQuery.data?.data.find((category) => category.id === categoryFilter)?.name ?? categoryFilter
          }`,
          onDelete: () => resetPageWith(setCategoryFilter),
        }
      : null,
    reportType === 'expenses' && expenseAccountFilter
      ? {
          key: 'expenseAccount',
          label: `${t('filters.expenseAccount')}: ${
            expenseAccountsQuery.data?.data.find((account) => account.id === expenseAccountFilter)?.name ?? expenseAccountFilter
          }`,
          onDelete: () => resetPageWith(setExpenseAccountFilter),
        }
      : null,
    reportType === 'cashRegisters' && cashRegisterFilter
      ? {
          key: 'cashRegister',
          label: `${t('filters.cashRegister')}: ${
            cashRegistersQuery.data?.data.find((register) => register.id === cashRegisterFilter)?.name ?? cashRegisterFilter
          }`,
          onDelete: () => resetPageWith(setCashRegisterFilter),
        }
      : null,
    branchFilter
      ? {
          key: 'branch',
          label: `${t('filters.branch')}: ${
            branchesQuery.data?.data.find((branch) => branch.id === branchFilter)?.name ?? branchFilter
          }`,
          onDelete: () => {
            setBranchFilter('')
            setWarehouseFilter('')
            setCashRegisterFilter('')
            setPage(0)
          },
        }
      : null,
    reportType !== 'expenses' && reportType !== 'cashRegisters' && warehouseFilter
      ? {
          key: 'warehouse',
          label: `${t('filters.warehouse')}: ${
            warehousesQuery.data?.data.find((warehouse) => warehouse.id === warehouseFilter)?.name ?? warehouseFilter
          }`,
          onDelete: () => resetPageWith(setWarehouseFilter),
        }
      : null,
    (reportType === 'purchases' || reportType === 'purchaseReturns' || reportType === 'purchasePayments') && supplierFilter
      ? {
          key: 'supplier',
          label: `${t('filters.supplier')}: ${
            suppliersQuery.data?.data.find((supplier) => supplier.id === supplierFilter)?.name ?? supplierFilter
          }`,
          onDelete: () => resetPageWith(setSupplierFilter),
        }
      : null,
    reportType !== 'stock' &&
    reportType !== 'expenses' &&
    reportType !== 'cashRegisters' &&
    reportType !== 'purchases' &&
    reportType !== 'purchaseReturns' &&
    reportType !== 'purchasePayments' &&
    customerFilter
      ? {
          key: 'customer',
          label: `${t('filters.customer')}: ${
            customersQuery.data?.data.find((customer) => customer.id === customerFilter)?.name ?? customerFilter
          }`,
          onDelete: () => resetPageWith(setCustomerFilter),
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
      <PageHeader title={t('title')} description={t('subtitle')} />

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

      <PageToolbar
        searchValue={search}
        searchPlaceholder={searchPlaceholder}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(0)
        }}
        filterButtonLabel={t('filters.showAdvanced')}
        clearFiltersLabel={t('filters.clear')}
        activeFilters={activeFilters}
        onClearFilters={activeFilters.length > 0 ? clearAdvancedFilters : undefined}
        actions={
          <FormControl sx={{ minWidth: { xs: '100%', sm: 220 } }}>
            <InputLabel>{t('filters.report')}</InputLabel>
            <Select
              value={reportType}
              label={t('filters.report')}
              onChange={(event) => {
                setReportType(event.target.value as ReportType)
                resetReportScopedFilters()
              }}
            >
              {reportTypes.map((option) => (
                <MenuItem key={option} value={option}>
                  {t(`reports.${option}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
        filters={
          <>
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
          </>
        }
      />

      <Card>
        <CardContent>
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
