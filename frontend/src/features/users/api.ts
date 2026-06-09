import api from '@/api/axios'
import { apiClient, unwrapApiResponse } from '@/api/client'
import type { ImportResult, UserAccessOptions, UserFilters, UserListItem, UserPayload } from '@/types/user'

export const usersApi = {
  list: (filters: UserFilters = {}) =>
    apiClient.getPaginated<UserListItem>('/v1/users', filters),
  options: () => apiClient.get<UserAccessOptions>('/v1/users/options'),
  create: (payload: UserPayload) =>
    apiClient.post<UserListItem, UserPayload>('/v1/users', payload),
  update: (id: string, payload: UserPayload) =>
    apiClient.put<UserListItem, UserPayload>(`/v1/users/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/users/${id}`),
  importUsers: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return unwrapApiResponse<ImportResult>(
      api.post('/v1/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
  },
  importTemplate: async () => {
    const response = await api.get<Blob>('/v1/users/import/template', {
      responseType: 'blob',
    })
    return response.data
  },
}
