'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { taxGroupsApi } from './api'
import type { TaxGroupFilters, TaxGroupPayload } from '@/types/taxGroup'

export const taxGroupKeys = {
  all: ['tax-groups'] as const,
  list: (filters: TaxGroupFilters) => [...taxGroupKeys.all, 'list', filters] as const,
}

export function useTaxGroupsQuery(filters: TaxGroupFilters) {
  return useQuery({
    queryKey: taxGroupKeys.list(filters),
    queryFn: () => taxGroupsApi.list(filters),
  })
}

export function useCreateTaxGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TaxGroupPayload) => taxGroupsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxGroupKeys.all })
    },
  })
}

export function useUpdateTaxGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TaxGroupPayload }) =>
      taxGroupsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxGroupKeys.all })
    },
  })
}

export function useDeleteTaxGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => taxGroupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxGroupKeys.all })
    },
  })
}
