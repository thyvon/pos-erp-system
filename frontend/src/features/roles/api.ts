import { apiClient } from '@/api/client'
import type { RoleFilters, RoleListItem, RoleOptions, RolePayload } from '@/types/role'

export const rolesApi = {
  list: (filters: RoleFilters = {}) =>
    apiClient.getPaginated<RoleListItem>('/v1/roles', filters),
  options: () => apiClient.get<RoleOptions>('/v1/roles/options'),
  create: (payload: RolePayload) =>
    apiClient.post<RoleListItem, RolePayload>('/v1/roles', payload),
  update: (id: number, payload: RolePayload) =>
    apiClient.put<RoleListItem, RolePayload>(`/v1/roles/${id}`, payload),
  delete: (id: number) => apiClient.delete<null>(`/v1/roles/${id}`),
}
