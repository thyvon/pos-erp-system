import { apiClient } from '@/api/client'
import type {
  ManagedBusiness,
  ManagedBusinessFilters,
  ManagedBusinessModule,
  ManagedBusinessModulePayload,
  ManagedBusinessPayload,
} from '@/types/businessManagement'

export const managedBusinessesApi = {
  list: (filters: ManagedBusinessFilters = {}) =>
    apiClient.getPaginated<ManagedBusiness>('/v1/admin/businesses', filters),
  show: (id: string) => apiClient.get<ManagedBusiness>(`/v1/admin/businesses/${id}`),
  create: (payload: ManagedBusinessPayload) =>
    apiClient.post<ManagedBusiness, ManagedBusinessPayload>('/v1/admin/businesses', payload),
  update: (id: string, payload: ManagedBusinessPayload) =>
    apiClient.put<ManagedBusiness, ManagedBusinessPayload>(`/v1/admin/businesses/${id}`, payload),
  modules: (id: string) => apiClient.get<ManagedBusinessModule[]>(`/v1/admin/businesses/${id}/modules`),
  updateModules: (id: string, modules: ManagedBusinessModulePayload[]) =>
    apiClient.put<ManagedBusinessModule[], { modules: ManagedBusinessModulePayload[] }>(
      `/v1/admin/businesses/${id}/modules`,
      { modules }
    ),
}
