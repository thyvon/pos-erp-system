'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { unitsApi } from './api'
import type { UnitFilters, UnitPayload } from '@/types/unit'

export const unitKeys = {
  all: ['units'] as const,
  list: (filters: UnitFilters) => [...unitKeys.all, 'list', filters] as const,
  options: () => [...unitKeys.all, 'options'] as const,
}

export function useUnitsQuery(filters: UnitFilters) {
  return useQuery({
    queryKey: unitKeys.list(filters),
    queryFn: () => unitsApi.list(filters),
  })
}

export function useUnitOptionsQuery() {
  return useQuery({
    queryKey: unitKeys.options(),
    queryFn: () => unitsApi.options(),
  })
}

export function useCreateUnitMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UnitPayload) => unitsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all })
    },
  })
}

export function useUpdateUnitMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UnitPayload }) =>
      unitsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all })
    },
  })
}

export function useDeleteUnitMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => unitsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all })
    },
  })
}
