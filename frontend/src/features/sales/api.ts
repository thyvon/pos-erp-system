import { apiClient } from '@/api/client'
import type {
  Sale,
  SaleCancelPayload,
  SalePaymentCorrectionPayload,
  SalePaymentCorrectionResult,
  SaleFilters,
  SalePayload,
  SalePaymentPayload,
  SalePaymentResult,
} from '@/types/sales'

export const salesApi = {
  list: (filters: SaleFilters = {}) => apiClient.getPaginated<Sale>('/v1/sales', filters),
  show: (id: string) => apiClient.get<Sale>(`/v1/sales/${id}`),
  create: (payload: SalePayload) => apiClient.post<Sale, SalePayload>('/v1/sales', payload),
  update: (id: string, payload: SalePayload) => apiClient.put<Sale, SalePayload>(`/v1/sales/${id}`, payload),
  delete: (id: string) => apiClient.delete<void>(`/v1/sales/${id}`),
  confirm: (id: string) => apiClient.post<Sale>(`/v1/sales/${id}/confirm`),
  complete: (id: string) => apiClient.post<Sale>(`/v1/sales/${id}/complete`),
  cancel: (id: string, payload: SaleCancelPayload) =>
    apiClient.post<Sale, SaleCancelPayload>(`/v1/sales/${id}/cancel`, payload),
  recordPayment: (id: string, payload: SalePaymentPayload) =>
    apiClient.post<SalePaymentResult, SalePaymentPayload>(`/v1/sales/${id}/payments`, payload),
  updatePayment: (saleId: string, paymentId: string, payload: SalePaymentCorrectionPayload) =>
    apiClient.put<SalePaymentCorrectionResult, SalePaymentCorrectionPayload>(`/v1/sales/${saleId}/payments/${paymentId}`, payload),
}
