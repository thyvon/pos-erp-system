import { apiClient } from '@/api/client'
import type { CustomFieldDefinition, CustomFieldFilters, CustomFieldPayload } from '@/types/customField'

const endpoint = '/v1/custom-field-definitions'

export const customFieldsApi = {
  list: (filters: CustomFieldFilters = {}) =>
    apiClient.getPaginated<CustomFieldDefinition>(endpoint, filters),
  create: (payload: CustomFieldPayload) =>
    apiClient.post<CustomFieldDefinition, CustomFieldPayload>(endpoint, payload),
  update: (id: string, payload: CustomFieldPayload) =>
    apiClient.put<CustomFieldDefinition, CustomFieldPayload>(`${endpoint}/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`${endpoint}/${id}`),
}
