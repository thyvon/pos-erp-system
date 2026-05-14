import api from '@/api/axios'
import { apiClient, unwrapApiResponse } from '@/api/client'
import type { Brand, BrandFilters, BrandPayload } from '@/types/brand'

function toBrandFormData(payload: BrandPayload, method?: 'PUT') {
  const formData = new FormData()

  if (method) formData.append('_method', method)
  formData.append('name', payload.name)
  formData.append('description', payload.description ?? '')
  formData.append('image_url', payload.image_url ?? '')
  if (payload.image_file instanceof File) {
    formData.append('image_file', payload.image_file)
  }

  return formData
}

export const brandsApi = {
  list: (filters: BrandFilters = {}) => apiClient.getPaginated<Brand>('/v1/brands', filters),
  options: () => apiClient.get<Brand[]>('/v1/brands/options'),
  create: (payload: BrandPayload) =>
    unwrapApiResponse<Brand>(
      api.post('/v1/brands', toBrandFormData(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ),
  update: (id: string, payload: BrandPayload) =>
    unwrapApiResponse<Brand>(
      api.post(`/v1/brands/${id}`, toBrandFormData(payload, 'PUT'), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ),
  delete: (id: string) => apiClient.delete<null>(`/v1/brands/${id}`),
}
