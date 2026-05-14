import { apiClient } from '@/api/client'
import type { TaxGroup, TaxGroupFilters, TaxGroupPayload } from '@/types/taxGroup'

export const taxGroupsApi = {
  list: (filters: TaxGroupFilters = {}) =>
    apiClient.getPaginated<TaxGroup>('/v1/tax-groups', filters),
  create: (payload: TaxGroupPayload) =>
    apiClient.post<TaxGroup, TaxGroupPayload>('/v1/tax-groups', payload),
  update: (id: string, payload: TaxGroupPayload) =>
    apiClient.put<TaxGroup, TaxGroupPayload>(`/v1/tax-groups/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/tax-groups/${id}`),
}
