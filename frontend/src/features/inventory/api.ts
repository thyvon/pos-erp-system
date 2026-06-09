import { apiClient } from '@/api/client'
import type {
  InventoryOptions,
  InventoryProductLookupItem,
  StockAdjustment,
  StockAdjustmentFilters,
  StockAdjustmentPayload,
  StockCount,
  StockCountCompletePayload,
  StockCountEntry,
  StockCountEntryFilters,
  StockCountEntryPayload,
  StockCountEntryUpdatePayload,
  StockCountFilters,
  StockCountItem,
  StockCountItemFilters,
  StockCountItemUpdatePayload,
  StockCountPayload,
  StockLevel,
  StockLevelFilters,
  StockLot,
  StockLotFilters,
  StockLotStatusPayload,
  StockOpeningBalance,
  StockOpeningBalanceFilters,
  StockOpeningBalancePayload,
  StockSerial,
  StockSerialFilters,
  StockSerialWriteOffPayload,
  StockTransfer,
  StockTransferFilters,
  StockTransferPayload,
} from '@/types/inventory'

export const inventoryApi = {
  options: () => apiClient.get<InventoryOptions>('/v1/inventory/options'),
  productLookup: (params: { q: string; warehouse_id?: string }) =>
    apiClient.get<InventoryProductLookupItem[]>('/v1/inventory/product-lookup', params),
}

export const stockAdjustmentsApi = {
  list: (filters: StockAdjustmentFilters = {}) =>
    apiClient.getPaginated<StockAdjustment>('/v1/inventory/adjustments', filters),
  show: (id: string) => apiClient.get<StockAdjustment>(`/v1/inventory/adjustments/${id}`),
  create: (payload: StockAdjustmentPayload) =>
    apiClient.post<StockAdjustment, StockAdjustmentPayload>('/v1/inventory/adjustments', payload),
  update: (id: string, payload: StockAdjustmentPayload) =>
    apiClient.put<StockAdjustment, StockAdjustmentPayload>(`/v1/inventory/adjustments/${id}`, payload),
}

export const stockOpeningBalancesApi = {
  list: (filters: StockOpeningBalanceFilters = {}) =>
    apiClient.getPaginated<StockOpeningBalance>('/v1/inventory/opening-balances', filters),
  show: (id: string) => apiClient.get<StockOpeningBalance>(`/v1/inventory/opening-balances/${id}`),
  create: (payload: StockOpeningBalancePayload) =>
    apiClient.post<StockOpeningBalance, StockOpeningBalancePayload>('/v1/inventory/opening-balances', payload),
}

export const stockTransfersApi = {
  list: (filters: StockTransferFilters = {}) =>
    apiClient.getPaginated<StockTransfer>('/v1/inventory/transfers', filters),
  show: (id: string) => apiClient.get<StockTransfer>(`/v1/inventory/transfers/${id}`),
  create: (payload: StockTransferPayload) =>
    apiClient.post<StockTransfer, StockTransferPayload>('/v1/inventory/transfers', payload),
  update: (id: string, payload: StockTransferPayload) =>
    apiClient.put<StockTransfer, StockTransferPayload>(`/v1/inventory/transfers/${id}`, payload),
  delete: (id: string) => apiClient.delete<void>(`/v1/inventory/transfers/${id}`),
  receive: (id: string) => apiClient.post<StockTransfer>(`/v1/inventory/transfers/${id}/receive`),
}

export const stockCountsApi = {
  list: (filters: StockCountFilters = {}) =>
    apiClient.getPaginated<StockCount>('/v1/inventory/counts', filters),
  show: (id: string) => apiClient.get<StockCount>(`/v1/inventory/counts/${id}`),
  items: (id: string, filters: StockCountItemFilters = {}) =>
    apiClient.getPaginated<StockCountItem>(`/v1/inventory/counts/${id}/items`, filters),
  entries: (id: string, filters: StockCountEntryFilters = {}) =>
    apiClient.getPaginated<StockCountEntry>(`/v1/inventory/counts/${id}/entries`, filters),
  create: (payload: StockCountPayload) =>
    apiClient.post<StockCount, StockCountPayload>('/v1/inventory/counts', payload),
  addEntry: (id: string, payload: StockCountEntryPayload) =>
    apiClient.post<StockCount, StockCountEntryPayload>(`/v1/inventory/counts/${id}/entries`, payload),
  updateEntry: (countId: string, entryId: string, payload: StockCountEntryUpdatePayload) =>
    apiClient.put<StockCount, StockCountEntryUpdatePayload>(`/v1/inventory/counts/${countId}/entries/${entryId}`, payload),
  updateItem: (countId: string, itemId: string, payload: StockCountItemUpdatePayload) =>
    apiClient.post<StockCount, StockCountItemUpdatePayload>(`/v1/inventory/counts/${countId}/items/${itemId}`, payload),
  deleteItem: (countId: string, itemId: string) =>
    apiClient.delete<StockCount>(`/v1/inventory/counts/${countId}/items/${itemId}`),
  complete: (id: string, payload: StockCountCompletePayload = {}) =>
    apiClient.post<StockCount, StockCountCompletePayload>(`/v1/inventory/counts/${id}/complete`, payload),
  delete: (id: string) => apiClient.delete<void>(`/v1/inventory/counts/${id}`),
}

export const stockLevelsApi = {
  list: (filters: StockLevelFilters = {}) =>
    apiClient.getPaginated<StockLevel>('/v1/inventory/stock', filters),
  show: (id: string) => apiClient.get<StockLevel>(`/v1/inventory/stock/${id}`),
}

export const stockLotsApi = {
  list: (filters: StockLotFilters = {}) =>
    apiClient.getPaginated<StockLot>('/v1/inventory/lots', filters),
  show: (id: string) => apiClient.get<StockLot>(`/v1/inventory/lots/${id}`),
  updateStatus: (id: string, payload: StockLotStatusPayload) =>
    apiClient.post<StockLot, StockLotStatusPayload>(`/v1/inventory/lots/${id}/status`, payload),
}

export const stockSerialsApi = {
  list: (filters: StockSerialFilters = {}) =>
    apiClient.getPaginated<StockSerial>('/v1/inventory/serials', filters),
  show: (id: string) => apiClient.get<StockSerial>(`/v1/inventory/serials/${id}`),
  writeOff: (id: string, payload: StockSerialWriteOffPayload) =>
    apiClient.post<StockSerial, StockSerialWriteOffPayload>(`/v1/inventory/serials/${id}/write-off`, payload),
}
