import { apiClient } from '@/api/client'
import type { Warehouse, WarehouseFilters, WarehousePayload } from '@/types/warehouse'

export const warehousesApi = {
  list: (filters: WarehouseFilters = {}) =>
    apiClient.getPaginated<Warehouse>('/v1/warehouses', filters),
  create: (payload: WarehousePayload) =>
    apiClient.post<Warehouse, WarehousePayload>('/v1/warehouses', payload),
  update: (id: string, payload: WarehousePayload) =>
    apiClient.put<Warehouse, WarehousePayload>(`/v1/warehouses/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/warehouses/${id}`),
}
