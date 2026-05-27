import { apiClient } from '@/api/client'
import type {
  CashRegister,
  CashRegisterFilters,
  CashRegisterSession,
  CreateCashRegisterPayload,
  OpenCashRegisterSessionPayload,
  Sale,
  SaleCancelPayload,
  SalePaymentCorrectionPayload,
  SalePaymentCorrectionResult,
  SalePaymentDeletePayload,
  SalePaymentDeleteResult,
  SaleFilters,
  SalePayload,
  SalePaymentPayload,
  SalePaymentResult,
  SaleWithPaymentsPayload,
} from '@/types/sales'

export const salesApi = {
  list: (filters: SaleFilters = {}) => apiClient.getPaginated<Sale>('/v1/sales', filters),
  show: (id: string) => apiClient.get<Sale>(`/v1/sales/${id}`),
  create: (payload: SalePayload) => apiClient.post<Sale, SalePayload>('/v1/sales', payload),
  update: (id: string, payload: SalePayload) => apiClient.put<Sale, SalePayload>(`/v1/sales/${id}`, payload),
  updateWithPayments: (id: string, payload: SaleWithPaymentsPayload) =>
    apiClient.put<Sale, SaleWithPaymentsPayload>(`/v1/sales/${id}/with-payments`, payload),
  delete: (id: string) => apiClient.delete<void>(`/v1/sales/${id}`),
  confirm: (id: string) => apiClient.post<Sale>(`/v1/sales/${id}/confirm`),
  complete: (id: string) => apiClient.post<Sale>(`/v1/sales/${id}/complete`),
  cancel: (id: string, payload: SaleCancelPayload) =>
    apiClient.post<Sale, SaleCancelPayload>(`/v1/sales/${id}/cancel`, payload),
  recordPayment: (id: string, payload: SalePaymentPayload) =>
    apiClient.post<SalePaymentResult, SalePaymentPayload>(`/v1/sales/${id}/payments`, payload),
  updatePayment: (saleId: string, paymentId: string, payload: SalePaymentCorrectionPayload) =>
    apiClient.put<SalePaymentCorrectionResult, SalePaymentCorrectionPayload>(`/v1/sales/${saleId}/payments/${paymentId}`, payload),
  deletePayment: (saleId: string, paymentId: string, payload: SalePaymentDeletePayload = {}) =>
    apiClient.delete<SalePaymentDeleteResult>(`/v1/sales/${saleId}/payments/${paymentId}`, { data: payload }),
}

export const cashRegistersApi = {
  list: (filters: CashRegisterFilters = {}) => apiClient.getPaginated<CashRegister>('/v1/cash-registers', filters),
  create: (payload: CreateCashRegisterPayload) =>
    apiClient.post<CashRegister, CreateCashRegisterPayload>('/v1/cash-registers', payload),
  openSession: (id: string, payload: OpenCashRegisterSessionPayload) =>
    apiClient.post<CashRegisterSession, OpenCashRegisterSessionPayload>(`/v1/cash-registers/${id}/open-session`, payload),
}
