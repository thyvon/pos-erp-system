import { apiClient } from '@/api/client'
import type { ManagedBusiness, ManagedBusinessFilters, ManagedBusinessPayload } from '@/types/businessManagement'

export const managedBusinessesApi = {
  list: (filters: ManagedBusinessFilters = {}) =>
    apiClient.getPaginated<ManagedBusiness>('/v1/admin/businesses', filters),
  show: (id: string) => apiClient.get<ManagedBusiness>(`/v1/admin/businesses/${id}`),
  create: (payload: ManagedBusinessPayload) =>
    apiClient.post<ManagedBusiness, ManagedBusinessPayload>('/v1/admin/businesses', payload),
  update: (id: string, payload: ManagedBusinessPayload) =>
    apiClient.put<ManagedBusiness, ManagedBusinessPayload>(`/v1/admin/businesses/${id}`, payload),
}
