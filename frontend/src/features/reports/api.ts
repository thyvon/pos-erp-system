import { apiClient } from '@/api/client'
import type {
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
}
