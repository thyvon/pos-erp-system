'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from './api'
import type { CategoryFilters, CategoryPayload } from '@/types/category'

export const categoryKeys = {
  all: ['categories'] as const,
  list: (filters: CategoryFilters) => [...categoryKeys.all, 'list', filters] as const,
  options: () => [...categoryKeys.all, 'options'] as const,
}

export function useCategoriesQuery(filters: CategoryFilters) {
  return useQuery({
    queryKey: categoryKeys.list(filters),
    queryFn: () => categoriesApi.list(filters),
  })
}

export function useCategoryOptionsQuery() {
  return useQuery({
    queryKey: categoryKeys.options(),
    queryFn: () => categoriesApi.options(),
  })
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CategoryPayload) => categoriesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CategoryPayload }) =>
      categoriesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
