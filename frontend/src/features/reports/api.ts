import { apiClient } from '@/api/client'
import type {
  CashRegistersReportFilters,
  CashRegistersReportResponse,
  ExpensesReportFilters,
  ExpensesReportResponse,
  PurchasesReportFilters,
  PurchasesReportResponse,
  PurchasePaymentsReportFilters,
  PurchasePaymentsReportResponse,
  PurchaseReturnsReportFilters,
  PurchaseReturnsReportResponse,
  SalePaymentsReportFilters,
  SalePaymentsReportResponse,
  SalesReportFilters,
  SalesReportResponse,
  SalesReturnReportFilters,
  SalesReturnReportResponse,
  StockReportFilters,
  StockReportResponse,
} from '@/types/report'

export const reportsApi = {
  sales: (filters: SalesReportFilters = {}) =>
    apiClient.get<SalesReportResponse>('/v1/reports/sales', filters),
  salesReturns: (filters: SalesReturnReportFilters = {}) =>
    apiClient.get<SalesReturnReportResponse>('/v1/reports/sales-returns', filters),
  purchases: (filters: PurchasesReportFilters = {}) =>
    apiClient.get<PurchasesReportResponse>('/v1/reports/purchases', filters),
  purchaseReturns: (filters: PurchaseReturnsReportFilters = {}) =>
    apiClient.get<PurchaseReturnsReportResponse>('/v1/reports/purchase-returns', filters),
  salePayments: (filters: SalePaymentsReportFilters = {}) =>
    apiClient.get<SalePaymentsReportResponse>('/v1/reports/sale-payments', filters),
  purchasePayments: (filters: PurchasePaymentsReportFilters = {}) =>
    apiClient.get<PurchasePaymentsReportResponse>('/v1/reports/purchase-payments', filters),
  stock: (filters: StockReportFilters = {}) =>
    apiClient.get<StockReportResponse>('/v1/reports/stock', filters),
  expenses: (filters: ExpensesReportFilters = {}) =>
    apiClient.get<ExpensesReportResponse>('/v1/reports/expenses', filters),
  cashRegisters: (filters: CashRegistersReportFilters = {}) =>
    apiClient.get<CashRegistersReportResponse>('/v1/reports/cash-registers', filters),
}
