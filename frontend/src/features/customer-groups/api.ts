import { apiClient } from '@/api/client'
import type { CustomerGroup, CustomerGroupFilters, CustomerGroupPayload } from '@/types/customerGroup'

export const customerGroupsApi = {
  list: (filters: CustomerGroupFilters = {}) =>
    apiClient.getPaginated<CustomerGroup>('/v1/customer-groups', filters),
  create: (payload: CustomerGroupPayload) =>
    apiClient.post<CustomerGroup, CustomerGroupPayload>('/v1/customer-groups', payload),
  update: (id: string, payload: CustomerGroupPayload) =>
    apiClient.put<CustomerGroup, CustomerGroupPayload>(`/v1/customer-groups/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/customer-groups/${id}`),
}
