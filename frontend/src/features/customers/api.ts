import { apiClient } from '@/api/client'
import type { Customer, CustomerFilters, CustomerPayload } from '@/types/customer'

export const customersApi = {
  list: (filters: CustomerFilters = {}) =>
    apiClient.getPaginated<Customer>('/v1/customers', filters),
  create: (payload: CustomerPayload) =>
    apiClient.post<Customer, CustomerPayload>('/v1/customers', payload),
  update: (id: string, payload: CustomerPayload) =>
    apiClient.put<Customer, CustomerPayload>(`/v1/customers/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/customers/${id}`),
}
