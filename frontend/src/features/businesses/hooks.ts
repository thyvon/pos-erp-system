'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managedBusinessesApi } from './api'
import type { ManagedBusinessFilters, ManagedBusinessModulePayload, ManagedBusinessPayload } from '@/types/businessManagement'

export const managedBusinessKeys = {
  all: ['managed-businesses'] as const,
  list: (filters: ManagedBusinessFilters) => [...managedBusinessKeys.all, 'list', filters] as const,
  detail: (id: string | null) => [...managedBusinessKeys.all, 'detail', id] as const,
  modules: (id: string | null) => [...managedBusinessKeys.all, 'modules', id] as const,
}

export function useManagedBusinessesQuery(filters: ManagedBusinessFilters, enabled = true) {
  return useQuery({
    queryKey: managedBusinessKeys.list(filters),
    queryFn: () => managedBusinessesApi.list(filters),
    enabled,
  })
}

export function useManagedBusinessQuery(id: string | null, enabled = true) {
  return useQuery({
    queryKey: managedBusinessKeys.detail(id),
    queryFn: () => managedBusinessesApi.show(id ?? ''),
    enabled: enabled && !!id,
  })
}

export function useCreateManagedBusinessMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ManagedBusinessPayload) => managedBusinessesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedBusinessKeys.all })
    },
  })
}

export function useUpdateManagedBusinessMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ManagedBusinessPayload }) =>
      managedBusinessesApi.update(id, payload),
    onSuccess: (business) => {
      queryClient.invalidateQueries({ queryKey: managedBusinessKeys.all })
      queryClient.invalidateQueries({ queryKey: managedBusinessKeys.detail(business.id) })
    },
  })
}

export function useManagedBusinessModulesQuery(id: string | null, enabled = true) {
  return useQuery({
    queryKey: managedBusinessKeys.modules(id),
    queryFn: () => managedBusinessesApi.modules(id ?? ''),
    enabled: enabled && !!id,
  })
}

export function useUpdateManagedBusinessModulesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, modules }: { id: string; modules: ManagedBusinessModulePayload[] }) =>
      managedBusinessesApi.updateModules(id, modules),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: managedBusinessKeys.modules(variables.id) })
      queryClient.invalidateQueries({ queryKey: managedBusinessKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: managedBusinessKeys.all })
    },
  })
}
