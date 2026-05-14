'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { brandsApi } from './api'
import type { BrandFilters, BrandPayload } from '@/types/brand'

export const brandKeys = {
  all: ['brands'] as const,
  list: (filters: BrandFilters) => [...brandKeys.all, 'list', filters] as const,
  options: () => [...brandKeys.all, 'options'] as const,
}

export function useBrandsQuery(filters: BrandFilters) {
  return useQuery({
    queryKey: brandKeys.list(filters),
    queryFn: () => brandsApi.list(filters),
  })
}

export function useBrandOptionsQuery() {
  return useQuery({
    queryKey: brandKeys.options(),
    queryFn: () => brandsApi.options(),
  })
}

export function useCreateBrandMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BrandPayload) => brandsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all })
    },
  })
}

export function useUpdateBrandMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BrandPayload }) =>
      brandsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all })
    },
  })
}

export function useDeleteBrandMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => brandsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all })
    },
  })
}
