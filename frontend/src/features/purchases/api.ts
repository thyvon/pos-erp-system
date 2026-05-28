import { apiClient } from '@/api/client'
import type { Purchase, PurchaseFilters, PurchasePayload, ReceivePurchasePayload } from '@/types/purchase'

export const purchasesApi = {
  list: (filters: PurchaseFilters = {}) => apiClient.getPaginated<Purchase>('/v1/purchases', filters),
  show: (id: string) => apiClient.get<Purchase>(`/v1/purchases/${id}`),
  create: (payload: PurchasePayload) => apiClient.post<Purchase, PurchasePayload>('/v1/purchases', payload),
  update: (id: string, payload: PurchasePayload) =>
    apiClient.put<Purchase, PurchasePayload>(`/v1/purchases/${id}`, payload),
  delete: (id: string) => apiClient.delete<void>(`/v1/purchases/${id}`),
  receive: (id: string, payload: ReceivePurchasePayload) =>
    apiClient.post<Purchase, ReceivePurchasePayload>(`/v1/purchases/${id}/receive`, payload),
}
