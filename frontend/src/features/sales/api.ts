import { apiClient } from '@/api/client'
import type {
  CashRegister,
  CashRegisterFilters,
  CashRegisterSession,
  CloseCashRegisterSessionPayload,
  CreateCashRegisterPayload,
  QuotationConvertPayload,
  QuotationConvertResult,
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
  SaleReturn,
  SaleReturnFilters,
  SaleReturnPayload,
  SaleWithPaymentsPayload,
  UpdateCashRegisterPayload,
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

export const quotationsApi = {
  list: (filters: SaleFilters = {}) => apiClient.getPaginated<Sale>('/v1/quotations', filters),
  show: (id: string) => apiClient.get<Sale>(`/v1/quotations/${id}`),
  create: (payload: SalePayload) => apiClient.post<Sale, SalePayload>('/v1/quotations', payload),
  convert: (id: string, payload: QuotationConvertPayload) =>
    apiClient.post<QuotationConvertResult, QuotationConvertPayload>(`/v1/quotations/${id}/convert`, payload),
  cancel: (id: string, payload: SaleCancelPayload) =>
    apiClient.post<Sale, SaleCancelPayload>(`/v1/quotations/${id}/cancel`, payload),
}

export const saleReturnsApi = {
  list: (filters: SaleReturnFilters = {}) => apiClient.getPaginated<SaleReturn>('/v1/sale-returns', filters),
  show: (id: string) => apiClient.get<SaleReturn>(`/v1/sale-returns/${id}`),
  create: (saleId: string, payload: SaleReturnPayload) =>
    apiClient.post<SaleReturn, SaleReturnPayload>(`/v1/sales/${saleId}/returns`, payload),
}

export const cashRegistersApi = {
  list: (filters: CashRegisterFilters = {}) => apiClient.getPaginated<CashRegister>('/v1/cash-registers', filters),
  show: (id: string) => apiClient.get<CashRegister>(`/v1/cash-registers/${id}`),
  create: (payload: CreateCashRegisterPayload) =>
    apiClient.post<CashRegister, CreateCashRegisterPayload>('/v1/cash-registers', payload),
  update: (id: string, payload: UpdateCashRegisterPayload) =>
    apiClient.put<CashRegister, UpdateCashRegisterPayload>(`/v1/cash-registers/${id}`, payload),
  delete: (id: string) => apiClient.delete<void>(`/v1/cash-registers/${id}`),
  openSession: (id: string, payload: OpenCashRegisterSessionPayload) =>
    apiClient.post<CashRegisterSession, OpenCashRegisterSessionPayload>(`/v1/cash-registers/${id}/open-session`, payload),
  closeSession: (sessionId: string, payload: CloseCashRegisterSessionPayload) =>
    apiClient.post<CashRegisterSession, CloseCashRegisterSessionPayload>(`/v1/cash-register-sessions/${sessionId}/close`, payload),
}
