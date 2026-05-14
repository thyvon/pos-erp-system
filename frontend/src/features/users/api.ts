import { apiClient } from '@/api/client'
import type { UserFilters, UserListItem } from '@/types/user'

export const usersApi = {
  list: (filters: UserFilters = {}) =>
    apiClient.getPaginated<UserListItem>('/v1/users', filters),
}
