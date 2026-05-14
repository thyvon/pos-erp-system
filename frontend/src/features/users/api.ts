import { apiClient } from '@/api/client'
import type { UserAccessOptions, UserFilters, UserListItem, UserPayload } from '@/types/user'

export const usersApi = {
  list: (filters: UserFilters = {}) =>
    apiClient.getPaginated<UserListItem>('/v1/users', filters),
  options: () => apiClient.get<UserAccessOptions>('/v1/users/options'),
  create: (payload: UserPayload) =>
    apiClient.post<UserListItem, UserPayload>('/v1/users', payload),
  update: (id: string, payload: UserPayload) =>
    apiClient.put<UserListItem, UserPayload>(`/v1/users/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/users/${id}`),
}
