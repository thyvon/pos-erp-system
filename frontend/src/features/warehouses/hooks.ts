'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { warehousesApi } from './api'
import type { WarehouseFilters, WarehousePayload } from '@/types/warehouse'

export const warehouseKeys = {
  all: ['warehouses'] as const,
  list: (filters: WarehouseFilters) => [...warehouseKeys.all, 'list', filters] as const,
}

export function useWarehousesQuery(filters: WarehouseFilters) {
  return useQuery({
    queryKey: warehouseKeys.list(filters),
    queryFn: () => warehousesApi.list(filters),
  })
}

export function useCreateWarehouseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: WarehousePayload) => warehousesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
    },
  })
}

export function useUpdateWarehouseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WarehousePayload }) =>
      warehousesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
    },
  })
}

export function useDeleteWarehouseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => warehousesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all })
    },
  })
}
