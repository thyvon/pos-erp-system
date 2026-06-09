'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryApi, stockAdjustmentsApi, stockCountsApi, stockLevelsApi, stockLotsApi, stockOpeningBalancesApi, stockSerialsApi, stockTransfersApi } from './api'
import type {
  StockAdjustmentFilters,
  StockAdjustmentPayload,
  StockCountCompletePayload,
  StockCountEntryFilters,
  StockCountEntryPayload,
  StockCountEntryUpdatePayload,
  StockCountFilters,
  StockCountItemFilters,
  StockCountItemUpdatePayload,
  StockCountPayload,
  StockLevelFilters,
  StockLotFilters,
  StockLotStatusPayload,
  StockOpeningBalanceFilters,
  StockOpeningBalancePayload,
  StockSerialFilters,
  StockSerialWriteOffPayload,
  StockTransferFilters,
  StockTransferPayload,
} from '@/types/inventory'

export const inventoryKeys = {
  all: ['inventory'] as const,
  options: () => [...inventoryKeys.all, 'options'] as const,
  productLookup: (q: string, warehouseId?: string) =>
    [...inventoryKeys.all, 'product-lookup', q, warehouseId ?? 'all'] as const,
}

export const stockAdjustmentKeys = {
  all: ['stock-adjustments'] as const,
  list: (filters: StockAdjustmentFilters) => [...stockAdjustmentKeys.all, 'list', filters] as const,
  detail: (id: string) => [...stockAdjustmentKeys.all, 'detail', id] as const,
}

export const stockOpeningBalanceKeys = {
  all: ['stock-opening-balances'] as const,
  list: (filters: StockOpeningBalanceFilters) => [...stockOpeningBalanceKeys.all, 'list', filters] as const,
  detail: (id: string) => [...stockOpeningBalanceKeys.all, 'detail', id] as const,
}

export const stockTransferKeys = {
  all: ['stock-transfers'] as const,
  list: (filters: StockTransferFilters) => [...stockTransferKeys.all, 'list', filters] as const,
  detail: (id: string) => [...stockTransferKeys.all, 'detail', id] as const,
}

export const stockCountKeys = {
  all: ['stock-counts'] as const,
  list: (filters: StockCountFilters) => [...stockCountKeys.all, 'list', filters] as const,
  detail: (id: string) => [...stockCountKeys.all, 'detail', id] as const,
  items: (id: string, filters: StockCountItemFilters) => [...stockCountKeys.detail(id), 'items', filters] as const,
  entries: (id: string, filters: StockCountEntryFilters) => [...stockCountKeys.detail(id), 'entries', filters] as const,
}

export const stockLevelKeys = {
  all: ['stock-levels'] as const,
  list: (filters: StockLevelFilters) => [...stockLevelKeys.all, 'list', filters] as const,
  detail: (id: string) => [...stockLevelKeys.all, 'detail', id] as const,
}

export const stockLotKeys = {
  all: ['stock-lots'] as const,
  list: (filters: StockLotFilters) => [...stockLotKeys.all, 'list', filters] as const,
  detail: (id: string) => [...stockLotKeys.all, 'detail', id] as const,
}

export const stockSerialKeys = {
  all: ['stock-serials'] as const,
  list: (filters: StockSerialFilters) => [...stockSerialKeys.all, 'list', filters] as const,
  detail: (id: string) => [...stockSerialKeys.all, 'detail', id] as const,
}

export function useInventoryOptionsQuery() {
  return useQuery({
    queryKey: inventoryKeys.options(),
    queryFn: () => inventoryApi.options(),
  })
}

export function useInventoryProductLookupQuery(q: string, warehouseId?: string) {
  const term = q.trim()

  return useQuery({
    queryKey: inventoryKeys.productLookup(term, warehouseId),
    queryFn: () => inventoryApi.productLookup({ q: term, warehouse_id: warehouseId }),
    enabled: term.length >= 2,
  })
}

export function useStockAdjustmentsQuery(filters: StockAdjustmentFilters) {
  return useQuery({
    queryKey: stockAdjustmentKeys.list(filters),
    queryFn: () => stockAdjustmentsApi.list(filters),
  })
}

export function useStockAdjustmentQuery(id: string | null) {
  return useQuery({
    queryKey: id ? stockAdjustmentKeys.detail(id) : [...stockAdjustmentKeys.all, 'detail', 'none'],
    queryFn: () => stockAdjustmentsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCreateStockAdjustmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockAdjustmentPayload) => stockAdjustmentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.all })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useUpdateStockAdjustmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StockAdjustmentPayload }) =>
      stockAdjustmentsApi.update(id, payload),
    onSuccess: (adjustment) => {
      queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.all })
      queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.detail(adjustment.id) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useStockOpeningBalancesQuery(filters: StockOpeningBalanceFilters) {
  return useQuery({
    queryKey: stockOpeningBalanceKeys.list(filters),
    queryFn: () => stockOpeningBalancesApi.list(filters),
  })
}

export function useStockOpeningBalanceQuery(id: string | null) {
  return useQuery({
    queryKey: id ? stockOpeningBalanceKeys.detail(id) : [...stockOpeningBalanceKeys.all, 'detail', 'none'],
    queryFn: () => stockOpeningBalancesApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCreateStockOpeningBalanceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockOpeningBalancePayload) => stockOpeningBalancesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockOpeningBalanceKeys.all })
      queryClient.invalidateQueries({ queryKey: stockLevelKeys.all })
      queryClient.invalidateQueries({ queryKey: stockLotKeys.all })
      queryClient.invalidateQueries({ queryKey: stockSerialKeys.all })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useStockTransfersQuery(filters: StockTransferFilters) {
  return useQuery({
    queryKey: stockTransferKeys.list(filters),
    queryFn: () => stockTransfersApi.list(filters),
  })
}

export function useStockTransferQuery(id: string | null) {
  return useQuery({
    queryKey: id ? stockTransferKeys.detail(id) : [...stockTransferKeys.all, 'detail', 'none'],
    queryFn: () => stockTransfersApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCreateStockTransferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockTransferPayload) => stockTransfersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.all })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useUpdateStockTransferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StockTransferPayload }) =>
      stockTransfersApi.update(id, payload),
    onSuccess: (transfer) => {
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.all })
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.detail(transfer.id) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useDeleteStockTransferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => stockTransfersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.all })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useReceiveStockTransferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => stockTransfersApi.receive(id),
    onSuccess: (transfer) => {
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.all })
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.detail(transfer.id) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useStockCountsQuery(filters: StockCountFilters) {
  return useQuery({
    queryKey: stockCountKeys.list(filters),
    queryFn: () => stockCountsApi.list(filters),
  })
}

export function useStockCountQuery(id: string | null) {
  return useQuery({
    queryKey: id ? stockCountKeys.detail(id) : [...stockCountKeys.all, 'detail', 'none'],
    queryFn: () => stockCountsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useStockCountItemsQuery(id: string | null, filters: StockCountItemFilters) {
  return useQuery({
    queryKey: id ? stockCountKeys.items(id, filters) : [...stockCountKeys.all, 'items', 'none', filters],
    queryFn: () => stockCountsApi.items(id ?? '', filters),
    enabled: !!id,
  })
}

export function useStockCountEntriesQuery(id: string | null, filters: StockCountEntryFilters) {
  return useQuery({
    queryKey: id ? stockCountKeys.entries(id, filters) : [...stockCountKeys.all, 'entries', 'none', filters],
    queryFn: () => stockCountsApi.entries(id ?? '', filters),
    enabled: !!id,
  })
}

export function useCreateStockCountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: StockCountPayload) => stockCountsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockCountKeys.all })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useAddStockCountEntryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StockCountEntryPayload }) =>
      stockCountsApi.addEntry(id, payload),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: stockCountKeys.all })
      queryClient.invalidateQueries({ queryKey: stockCountKeys.detail(count.id) })
      queryClient.invalidateQueries({ queryKey: [...stockCountKeys.detail(count.id), 'items'] })
      queryClient.invalidateQueries({ queryKey: [...stockCountKeys.detail(count.id), 'entries'] })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useUpdateStockCountEntryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ countId, entryId, payload }: { countId: string; entryId: string; payload: StockCountEntryUpdatePayload }) =>
      stockCountsApi.updateEntry(countId, entryId, payload),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: stockCountKeys.all })
      queryClient.invalidateQueries({ queryKey: stockCountKeys.detail(count.id) })
      queryClient.invalidateQueries({ queryKey: [...stockCountKeys.detail(count.id), 'items'] })
      queryClient.invalidateQueries({ queryKey: [...stockCountKeys.detail(count.id), 'entries'] })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useUpdateStockCountItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ countId, itemId, payload }: { countId: string; itemId: string; payload: StockCountItemUpdatePayload }) =>
      stockCountsApi.updateItem(countId, itemId, payload),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: stockCountKeys.all })
      queryClient.invalidateQueries({ queryKey: stockCountKeys.detail(count.id) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useDeleteStockCountItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ countId, itemId }: { countId: string; itemId: string }) =>
      stockCountsApi.deleteItem(countId, itemId),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: stockCountKeys.all })
      queryClient.invalidateQueries({ queryKey: stockCountKeys.detail(count.id) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useCompleteStockCountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: StockCountCompletePayload }) =>
      stockCountsApi.complete(id, payload ?? {}),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: stockCountKeys.all })
      queryClient.invalidateQueries({ queryKey: stockCountKeys.detail(count.id) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useDeleteStockCountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => stockCountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockCountKeys.all })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useStockLevelsQuery(filters: StockLevelFilters) {
  return useQuery({
    queryKey: stockLevelKeys.list(filters),
    queryFn: () => stockLevelsApi.list(filters),
  })
}

export function useStockLevelQuery(id: string | null) {
  return useQuery({
    queryKey: id ? stockLevelKeys.detail(id) : [...stockLevelKeys.all, 'detail', 'none'],
    queryFn: () => stockLevelsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useStockLotsQuery(filters: StockLotFilters) {
  return useQuery({
    queryKey: stockLotKeys.list(filters),
    queryFn: () => stockLotsApi.list(filters),
  })
}

export function useStockLotQuery(id: string | null) {
  return useQuery({
    queryKey: id ? stockLotKeys.detail(id) : [...stockLotKeys.all, 'detail', 'none'],
    queryFn: () => stockLotsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useUpdateStockLotStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StockLotStatusPayload }) =>
      stockLotsApi.updateStatus(id, payload),
    onSuccess: (lot) => {
      queryClient.invalidateQueries({ queryKey: stockLotKeys.all })
      queryClient.invalidateQueries({ queryKey: stockLotKeys.detail(lot.id) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}

export function useStockSerialsQuery(filters: StockSerialFilters) {
  return useQuery({
    queryKey: stockSerialKeys.list(filters),
    queryFn: () => stockSerialsApi.list(filters),
  })
}

export function useStockSerialQuery(id: string | null) {
  return useQuery({
    queryKey: id ? stockSerialKeys.detail(id) : [...stockSerialKeys.all, 'detail', 'none'],
    queryFn: () => stockSerialsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useWriteOffStockSerialMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StockSerialWriteOffPayload }) =>
      stockSerialsApi.writeOff(id, payload),
    onSuccess: (serial) => {
      queryClient.invalidateQueries({ queryKey: stockSerialKeys.all })
      queryClient.invalidateQueries({ queryKey: stockSerialKeys.detail(serial.id) })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}
