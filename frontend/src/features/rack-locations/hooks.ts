'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rackLocationsApi } from './api'
import type { RackLocationFilters, RackLocationPayload } from '@/types/rackLocation'

export const rackLocationKeys = {
  all: ['rack-locations'] as const,
  list: (filters: RackLocationFilters) => [...rackLocationKeys.all, 'list', filters] as const,
  options: () => [...rackLocationKeys.all, 'options'] as const,
}

export function useRackLocationsQuery(filters: RackLocationFilters) {
  return useQuery({
    queryKey: rackLocationKeys.list(filters),
    queryFn: () => rackLocationsApi.list(filters),
  })
}

export function useRackLocationOptionsQuery() {
  return useQuery({
    queryKey: rackLocationKeys.options(),
    queryFn: () => rackLocationsApi.options(),
  })
}

export function useCreateRackLocationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RackLocationPayload) => rackLocationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rackLocationKeys.all })
    },
  })
}

export function useUpdateRackLocationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RackLocationPayload }) =>
      rackLocationsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rackLocationKeys.all })
    },
  })
}

export function useDeleteRackLocationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rackLocationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rackLocationKeys.all })
    },
  })
}
