import { apiClient } from '@/api/client'
import type { RackLocation, RackLocationFilters, RackLocationPayload } from '@/types/rackLocation'

export const rackLocationsApi = {
  list: (filters: RackLocationFilters = {}) =>
    apiClient.getPaginated<RackLocation>('/v1/rack-locations', filters),
  options: () => apiClient.get<RackLocation[]>('/v1/rack-locations/options'),
  create: (payload: RackLocationPayload) =>
    apiClient.post<RackLocation, RackLocationPayload>('/v1/rack-locations', payload),
  update: (id: string, payload: RackLocationPayload) =>
    apiClient.put<RackLocation, RackLocationPayload>(`/v1/rack-locations/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/rack-locations/${id}`),
}
