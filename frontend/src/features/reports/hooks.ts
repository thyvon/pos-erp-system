'use client'

import { useQuery } from '@tanstack/react-query'
import { reportsApi } from './api'
import type {
  PurchasesReportFilters,
  PurchasePaymentsReportFilters,
  PurchaseReturnsReportFilters,
  SalePaymentsReportFilters,
  SalesReportFilters,
  SalesReturnReportFilters,
} from '@/types/report'

export const reportKeys = {
  all: ['reports'] as const,
  sales: (filters: SalesReportFilters) => [...reportKeys.all, 'sales', filters] as const,
  salesReturns: (filters: SalesReturnReportFilters) => [...reportKeys.all, 'sales-returns', filters] as const,
  purchases: (filters: PurchasesReportFilters) => [...reportKeys.all, 'purchases', filters] as const,
  purchaseReturns: (filters: PurchaseReturnsReportFilters) => [...reportKeys.all, 'purchase-returns', filters] as const,
  salePayments: (filters: SalePaymentsReportFilters) => [...reportKeys.all, 'sale-payments', filters] as const,
  purchasePayments: (filters: PurchasePaymentsReportFilters) => [...reportKeys.all, 'purchase-payments', filters] as const,
}

export function useSalesReportQuery(filters: SalesReportFilters, enabled = true) {
  return useQuery({
    queryKey: reportKeys.sales(filters),
    queryFn: () => reportsApi.sales(filters),
    enabled,
  })
}

export function useSalesReturnReportQuery(filters: SalesReturnReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.salesReturns(filters),
    queryFn: () => reportsApi.salesReturns(filters),
    enabled,
  })
}

export function usePurchasesReportQuery(filters: PurchasesReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.purchases(filters),
    queryFn: () => reportsApi.purchases(filters),
    enabled,
  })
}

export function usePurchaseReturnsReportQuery(filters: PurchaseReturnsReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.purchaseReturns(filters),
    queryFn: () => reportsApi.purchaseReturns(filters),
    enabled,
  })
}

export function useSalePaymentsReportQuery(filters: SalePaymentsReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.salePayments(filters),
    queryFn: () => reportsApi.salePayments(filters),
    enabled,
  })
}

export function usePurchasePaymentsReportQuery(filters: PurchasePaymentsReportFilters, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.purchasePayments(filters),
    queryFn: () => reportsApi.purchasePayments(filters),
    enabled,
  })
}
