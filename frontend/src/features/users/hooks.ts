'use client'

import { useQuery } from '@tanstack/react-query'
import { usersApi } from './api'
import type { UserFilters } from '@/types/user'

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const,
}

export function useUsersQuery(filters: UserFilters, enabled = true) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersApi.list(filters),
    enabled,
  })
}
