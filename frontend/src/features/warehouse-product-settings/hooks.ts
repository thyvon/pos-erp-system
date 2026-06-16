'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { warehouseProductSettingsApi } from './api'
import type {
  WarehouseProductSettingFilters,
  WarehouseProductSettingPayload,
} from '@/types/warehouseProductSetting'

export const warehouseProductSettingKeys = {
  all: ['warehouse-product-settings'] as const,
  list: (filters: WarehouseProductSettingFilters) => [...warehouseProductSettingKeys.all, 'list', filters] as const,
  options: () => [...warehouseProductSettingKeys.all, 'options'] as const,
}

export function useWarehouseProductSettingsQuery(filters: WarehouseProductSettingFilters) {
  return useQuery({
    queryKey: warehouseProductSettingKeys.list(filters),
    queryFn: () => warehouseProductSettingsApi.list(filters),
  })
}

export function useWarehouseProductSettingOptionsQuery() {
  return useQuery({
    queryKey: warehouseProductSettingKeys.options(),
    queryFn: () => warehouseProductSettingsApi.options(),
  })
}

export function useCreateWarehouseProductSettingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: WarehouseProductSettingPayload) => warehouseProductSettingsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseProductSettingKeys.all })
    },
  })
}

export function useUpdateWarehouseProductSettingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WarehouseProductSettingPayload }) =>
      warehouseProductSettingsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseProductSettingKeys.all })
    },
  })
}

export function useDeleteWarehouseProductSettingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => warehouseProductSettingsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseProductSettingKeys.all })
    },
  })
}
