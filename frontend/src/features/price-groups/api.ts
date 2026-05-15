import { apiClient } from '@/api/client'
import type { PriceGroup, PriceGroupFilters, PriceGroupPayload } from '@/types/priceGroup'

export const priceGroupsApi = {
  list: (filters: PriceGroupFilters = {}) =>
    apiClient.getPaginated<PriceGroup>('/v1/price-groups', filters),
  create: (payload: PriceGroupPayload) =>
    apiClient.post<PriceGroup, PriceGroupPayload>('/v1/price-groups', payload),
  update: (id: string, payload: PriceGroupPayload) =>
    apiClient.put<PriceGroup, PriceGroupPayload>(`/v1/price-groups/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/price-groups/${id}`),
}
