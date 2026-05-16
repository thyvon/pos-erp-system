'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi } from './api'
import type { ProductFilters, ProductPayload } from '@/types/product'

export const productKeys = {
  all: ['products'] as const,
  list: (filters: ProductFilters) => [...productKeys.all, 'list', filters] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  formOptions: () => [...productKeys.all, 'form-options'] as const,
}

export function useProductsQuery(filters: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productsApi.list(filters),
  })
}

export function useProductQuery(id: string | null) {
  return useQuery({
    queryKey: id ? productKeys.detail(id) : [...productKeys.all, 'detail', 'none'],
    queryFn: () => productsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useProductFormOptionsQuery() {
  return useQuery({
    queryKey: productKeys.formOptions(),
    queryFn: () => productsApi.formOptions(),
  })
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProductPayload) => productsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductPayload }) =>
      productsApi.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) })
    },
  })
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}
