import api from '@/api/axios'
import { apiClient, unwrapApiResponse } from '@/api/client'
import type { ImportResult, UserAccessOptions, UserFilters, UserListItem, UserPayload } from '@/types/user'

function toUserFormData(payload: UserPayload, method?: 'PUT') {
  const formData = new FormData()

  if (method) formData.append('_method', method)
  formData.append('first_name', payload.first_name)
  formData.append('last_name', payload.last_name)
  formData.append('email', payload.email)
  if (payload.password) formData.append('password', payload.password)
  formData.append('phone', payload.phone ?? '')
  formData.append('avatar_url', payload.avatar_url ?? '')
  if (payload.avatar_file instanceof File) {
    formData.append('avatar_file', payload.avatar_file)
  }
  formData.append('status', payload.status ?? 'active')
  if (payload.max_discount !== undefined && payload.max_discount !== null) {
    formData.append('max_discount', String(payload.max_discount))
  }
  if (payload.commission_percentage !== undefined && payload.commission_percentage !== null) {
    formData.append('commission_percentage', String(payload.commission_percentage))
  }
  if (payload.sales_target_amount !== undefined && payload.sales_target_amount !== null) {
    formData.append('sales_target_amount', String(payload.sales_target_amount))
  }
  if (payload.preferences) {
    const prefs = payload.preferences as Record<string, string | undefined>
    formData.append('preferences[locale]', prefs.locale ?? 'en')
    formData.append('preferences[timezone]', prefs.timezone ?? 'UTC')
  }
  if (payload.roles) {
    payload.roles.forEach((role) => formData.append('roles[]', role))
  }
  if (payload.direct_permissions) {
    payload.direct_permissions.forEach((perm) => formData.append('direct_permissions[]', perm))
  }
  if (payload.branch_ids) {
    payload.branch_ids.forEach((id) => formData.append('branch_ids[]', id))
  }
  if (payload.warehouse_ids) {
    payload.warehouse_ids.forEach((id) => formData.append('warehouse_ids[]', id))
  }
  if (payload.default_branch_id) formData.append('default_branch_id', payload.default_branch_id)
  if (payload.default_warehouse_id) formData.append('default_warehouse_id', payload.default_warehouse_id)

  return formData
}

export const usersApi = {
  list: (filters: UserFilters = {}) =>
    apiClient.getPaginated<UserListItem>('/v1/users', filters),
  options: () => apiClient.get<UserAccessOptions>('/v1/users/options'),
  create: (payload: UserPayload) => {
    if (payload.avatar_file instanceof File) {
      return unwrapApiResponse<UserListItem>(
        api.post('/v1/users', toUserFormData(payload), {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      )
    }
    return apiClient.post<UserListItem, UserPayload>('/v1/users', payload)
  },
  update: (id: string, payload: UserPayload) => {
    if (payload.avatar_file instanceof File) {
      return unwrapApiResponse<UserListItem>(
        api.post(`/v1/users/${id}`, toUserFormData(payload, 'PUT'), {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      )
    }
    return apiClient.put<UserListItem, UserPayload>(`/v1/users/${id}`, payload)
  },
  get: (id: string) => apiClient.get<UserListItem>(`/v1/users/${id}`),
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
