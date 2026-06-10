import { apiClient } from '@/api/client'
import type { Purchase, PurchaseFilters, PurchasePayload, PurchasePaymentCorrectionPayload, PurchasePaymentDeletePayload, PurchasePaymentPayload, PurchasePaymentResult, PurchasePaymentCorrectionResult, PurchasePaymentDeleteResult, PurchaseReceive, PurchaseReturn, PurchaseReturnFilters, PurchaseReturnPayload, ReceivePurchasePayload, UpdatePurchaseReceivePayload } from '@/types/purchase'

export const purchasesApi = {
  list: (filters: PurchaseFilters = {}) => apiClient.getPaginated<Purchase>('/v1/purchases', filters),
  show: (id: string) => apiClient.get<Purchase>(`/v1/purchases/${id}`),
  create: (payload: PurchasePayload) => apiClient.post<Purchase, PurchasePayload>('/v1/purchases', payload),
  update: (id: string, payload: PurchasePayload) =>
    apiClient.put<Purchase, PurchasePayload>(`/v1/purchases/${id}`, payload),
  delete: (id: string) => apiClient.delete<void>(`/v1/purchases/${id}`),
  receive: (id: string, payload: ReceivePurchasePayload) =>
    apiClient.post<Purchase, ReceivePurchasePayload>(`/v1/purchases/${id}/receive`, payload),
  recordPayment: (id: string, payload: PurchasePaymentPayload) =>
    apiClient.post<PurchasePaymentResult, PurchasePaymentPayload>(`/v1/purchases/${id}/payments`, payload),
  updatePayment: (purchaseId: string, paymentId: string, payload: PurchasePaymentCorrectionPayload) =>
    apiClient.put<PurchasePaymentCorrectionResult, PurchasePaymentCorrectionPayload>(`/v1/purchases/${purchaseId}/payments/${paymentId}`, payload),
  deletePayment: (purchaseId: string, paymentId: string, payload: PurchasePaymentDeletePayload) =>
    apiClient.delete<PurchasePaymentDeleteResult>(`/v1/purchases/${purchaseId}/payments/${paymentId}`, { data: payload }),
}

export const purchaseReceivesApi = {
  show: (purchaseId: string, receiveId: string) =>
    apiClient.get<PurchaseReceive>(`/v1/purchases/${purchaseId}/receives/${receiveId}`),
  update: (purchaseId: string, receiveId: string, payload: UpdatePurchaseReceivePayload) =>
    apiClient.put<PurchaseReceive, UpdatePurchaseReceivePayload>(`/v1/purchases/${purchaseId}/receives/${receiveId}`, payload),
  delete: (purchaseId: string, receiveId: string) =>
    apiClient.delete<void>(`/v1/purchases/${purchaseId}/receives/${receiveId}`),
}

export const purchaseReturnsApi = {
  list: (filters: PurchaseReturnFilters = {}) => apiClient.getPaginated<PurchaseReturn>('/v1/purchase-returns', filters),
  show: (id: string) => apiClient.get<PurchaseReturn>(`/v1/purchase-returns/${id}`),
  create: (purchaseId: string, payload: PurchaseReturnPayload) =>
    apiClient.post<PurchaseReturn, PurchaseReturnPayload>(`/v1/purchases/${purchaseId}/returns`, payload),
}
