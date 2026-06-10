'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from './api'
import type { UserFilters, UserPayload } from '@/types/user'

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  options: () => [...userKeys.all, 'options'] as const,
}

export function useUsersQuery(filters: UserFilters, enabled = true) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersApi.list(filters),
    enabled,
  })
}

export function useUserQuery(id: string | null) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: () => usersApi.get(id!),
    enabled: !!id,
  })
}

export function useUserAccessOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: userKeys.options(),
    queryFn: () => usersApi.options(),
    enabled,
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UserPayload) => usersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserPayload }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}
