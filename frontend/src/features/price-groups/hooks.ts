'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { priceGroupsApi } from './api'
import type { PriceGroupFilters, PriceGroupPayload } from '@/types/priceGroup'

export const priceGroupKeys = {
  all: ['price-groups'] as const,
  list: (filters: PriceGroupFilters) => [...priceGroupKeys.all, 'list', filters] as const,
}

export function usePriceGroupsQuery(filters: PriceGroupFilters) {
  return useQuery({
    queryKey: priceGroupKeys.list(filters),
    queryFn: () => priceGroupsApi.list(filters),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreatePriceGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PriceGroupPayload) => priceGroupsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceGroupKeys.all })
    },
  })
}

export function useUpdatePriceGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PriceGroupPayload }) =>
      priceGroupsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceGroupKeys.all })
    },
  })
}

export function useDeletePriceGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => priceGroupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceGroupKeys.all })
    },
  })
}
