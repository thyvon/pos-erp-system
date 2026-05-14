'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { branchesApi } from './api'
import type { BranchFilters, BranchPayload } from '@/types/branch'

export const branchKeys = {
  all: ['branches'] as const,
  list: (filters: BranchFilters) => [...branchKeys.all, 'list', filters] as const,
}

export function useBranchesQuery(filters: BranchFilters) {
  return useQuery({
    queryKey: branchKeys.list(filters),
    queryFn: () => branchesApi.list(filters),
  })
}

export function useCreateBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BranchPayload) => branchesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all })
    },
  })
}

export function useUpdateBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BranchPayload }) =>
      branchesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all })
    },
  })
}

export function useDeleteBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => branchesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all })
    },
  })
}
