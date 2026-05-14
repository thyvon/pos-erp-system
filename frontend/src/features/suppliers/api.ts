import { apiClient } from '@/api/client'
import type { Supplier, SupplierFilters, SupplierPayload } from '@/types/supplier'

export const suppliersApi = {
  list: (filters: SupplierFilters = {}) =>
    apiClient.getPaginated<Supplier>('/v1/suppliers', filters),
  create: (payload: SupplierPayload) =>
    apiClient.post<Supplier, SupplierPayload>('/v1/suppliers', payload),
  update: (id: string, payload: SupplierPayload) =>
    apiClient.put<Supplier, SupplierPayload>(`/v1/suppliers/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/suppliers/${id}`),
}
