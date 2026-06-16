import { apiClient } from '@/api/client'
import type {
  WarehouseProductSetting,
  WarehouseProductSettingFilters,
  WarehouseProductSettingPayload,
} from '@/types/warehouseProductSetting'

export const warehouseProductSettingsApi = {
  list: (filters: WarehouseProductSettingFilters = {}) =>
    apiClient.getPaginated<WarehouseProductSetting>('/v1/warehouse-product-settings', filters),
  options: () => apiClient.get<WarehouseProductSetting[]>('/v1/warehouse-product-settings/options'),
  create: (payload: WarehouseProductSettingPayload) =>
    apiClient.post<WarehouseProductSetting, WarehouseProductSettingPayload>('/v1/warehouse-product-settings', payload),
  update: (id: string, payload: WarehouseProductSettingPayload) =>
    apiClient.put<WarehouseProductSetting, WarehouseProductSettingPayload>(`/v1/warehouse-product-settings/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/warehouse-product-settings/${id}`),
}
