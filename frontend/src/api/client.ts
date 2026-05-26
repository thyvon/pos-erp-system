import type { AxiosRequestConfig } from 'axios'
import api from './axios'
import { toAppApiError } from './errors'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

export async function unwrapApiResponse<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const response = await request
    return response.data.data
  } catch (error) {
    throw toAppApiError(error)
  }
}

export const apiClient = {
  get: <T>(url: string, params?: object) =>
    unwrapApiResponse<T>(api.get(url, { params })),
  getPaginated: async <T>(url: string, params?: object) => {
    try {
      const response = await api.get<PaginatedResponse<T>>(url, { params })
      return response.data
    } catch (error) {
      throw toAppApiError(error)
    }
  },
  post: <T, TPayload = unknown>(url: string, payload?: TPayload) =>
    unwrapApiResponse<T>(api.post(url, payload)),
  put: <T, TPayload = unknown>(url: string, payload?: TPayload) =>
    unwrapApiResponse<T>(api.put(url, payload)),
  delete: <T>(url: string, config?: AxiosRequestConfig) => unwrapApiResponse<T>(api.delete(url, config)),
}
