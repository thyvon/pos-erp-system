import { apiClient } from '@/api/client'
import type { Category, CategoryFilters, CategoryPayload } from '@/types/category'

export const categoriesApi = {
  list: (filters: CategoryFilters = {}) =>
    apiClient.getPaginated<Category>('/v1/categories', filters),
  options: () => apiClient.get<Category[]>('/v1/categories/options'),
  create: (payload: CategoryPayload) =>
    apiClient.post<Category, CategoryPayload>('/v1/categories', payload),
  update: (id: string, payload: CategoryPayload) =>
    apiClient.put<Category, CategoryPayload>(`/v1/categories/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/categories/${id}`),
}
