import { apiClient } from '@/api/client'
import type { Unit, UnitFilters, UnitPayload } from '@/types/unit'

export const unitsApi = {
  list: (filters: UnitFilters = {}) => apiClient.getPaginated<Unit>('/v1/units', filters),
  options: () => apiClient.get<Unit[]>('/v1/units/options'),
  create: (payload: UnitPayload) => apiClient.post<Unit, UnitPayload>('/v1/units', payload),
  update: (id: string, payload: UnitPayload) =>
    apiClient.put<Unit, UnitPayload>(`/v1/units/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/units/${id}`),
}
