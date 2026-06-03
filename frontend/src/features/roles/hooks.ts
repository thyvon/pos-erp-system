'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rolesApi } from './api'
import type { RoleFilters, RolePayload } from '@/types/role'

export const roleKeys = {
  all: ['roles'] as const,
  list: (filters: RoleFilters) => [...roleKeys.all, 'list', filters] as const,
  options: () => [...roleKeys.all, 'options'] as const,
}

export function useRolesQuery(filters: RoleFilters, enabled = true) {
  return useQuery({
    queryKey: roleKeys.list(filters),
    queryFn: () => rolesApi.list(filters),
    enabled,
  })
}

export function useRoleOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: roleKeys.options(),
    queryFn: () => rolesApi.options(),
    enabled,
  })
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RolePayload) => rolesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
    },
  })
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RolePayload }) =>
      rolesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
    },
  })
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all })
    },
  })
}
