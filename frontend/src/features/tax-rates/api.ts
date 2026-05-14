import { apiClient } from '@/api/client'
import type { TaxRate, TaxRateFilters, TaxRatePayload } from '@/types/taxRate'

export const taxRatesApi = {
  list: (filters: TaxRateFilters = {}) =>
    apiClient.getPaginated<TaxRate>('/v1/tax-rates', filters),
  create: (payload: TaxRatePayload) =>
    apiClient.post<TaxRate, TaxRatePayload>('/v1/tax-rates', payload),
  update: (id: string, payload: TaxRatePayload) =>
    apiClient.put<TaxRate, TaxRatePayload>(`/v1/tax-rates/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/tax-rates/${id}`),
}
