import api from '@/api/axios'
import { apiClient, unwrapApiResponse } from '@/api/client'
import type { Product, ProductFilters, ProductFormOptions, ProductPayload } from '@/types/product'

export interface ImportResult {
  imported: number
  skipped: number
}

function appendFormValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined) return

  if (value === null) {
    formData.append(key, '')
    return
  }

  if (typeof value === 'boolean') {
    formData.append(key, value ? '1' : '0')
    return
  }

  formData.append(key, String(value))
}

function toMultipartPayload(payload: ProductPayload, method?: 'PUT') {
  const formData = new FormData()
  const {
    variations = [],
    combo_items = [],
    variation_template_ids = [],
    custom_fields = {},
    image_file,
    ...rest
  } = payload

  if (method) {
    formData.append('_method', method)
  }

  Object.entries(rest).forEach(([key, value]) => appendFormValue(formData, key, value))

  if (image_file instanceof File) {
    formData.append('image_file', image_file)
  }

  formData.append('variation_template_ids', JSON.stringify(variation_template_ids))
  formData.append('variations', JSON.stringify(variations.map((variation) => {
    const copy = { ...variation }
    delete copy.image_file
    delete copy.image_url
    return copy
  })))
  formData.append('combo_items', JSON.stringify(combo_items))
  formData.append('custom_fields', JSON.stringify(custom_fields))

  variations.forEach((variation, index) => {
    if (variation.image_file instanceof File) {
      formData.append(`variation_image_files[${index}]`, variation.image_file)
    }
  })

  return formData
}

export const productsApi = {
  list: (filters: ProductFilters = {}) => apiClient.getPaginated<Product>('/v1/products', filters),
  formOptions: () => apiClient.get<ProductFormOptions>('/v1/products/form-options'),
  show: (id: string) => apiClient.get<Product>(`/v1/products/${id}`),
  create: (payload: ProductPayload) =>
    unwrapApiResponse<Product>(
      api.post('/v1/products', toMultipartPayload(payload), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ),
  update: (id: string, payload: ProductPayload) =>
    unwrapApiResponse<Product>(
      api.post(`/v1/products/${id}`, toMultipartPayload(payload, 'PUT'), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ),
  delete: (id: string) => apiClient.delete<null>(`/v1/products/${id}`),
  importProducts: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return unwrapApiResponse<ImportResult>(
      api.post('/v1/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
  },
  downloadTemplate: async (type: 'standard' | 'variable') => {
    const path = type === 'variable'
      ? '/v1/products/import/template/variable'
      : '/v1/products/import/template'
    const response = await api.get<Blob>(path, {
      responseType: 'blob',
    })
    return response.data
  },
}
