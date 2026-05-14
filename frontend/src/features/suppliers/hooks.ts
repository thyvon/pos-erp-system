'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { suppliersApi } from './api'
import type { SupplierFilters, SupplierPayload } from '@/types/supplier'

export const supplierKeys = {
  all: ['suppliers'] as const,
  list: (filters: SupplierFilters) => [...supplierKeys.all, 'list', filters] as const,
}

export function useSuppliersQuery(filters: SupplierFilters) {
  return useQuery({
    queryKey: supplierKeys.list(filters),
    queryFn: () => suppliersApi.list(filters),
  })
}

export function useCreateSupplierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SupplierPayload) => suppliersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all })
    },
  })
}

export function useUpdateSupplierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SupplierPayload }) =>
      suppliersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all })
    },
  })
}

export function useDeleteSupplierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all })
    },
  })
}
