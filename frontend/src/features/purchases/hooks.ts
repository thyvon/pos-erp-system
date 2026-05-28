'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { purchasesApi } from './api'
import type { PurchaseFilters, PurchasePayload, ReceivePurchasePayload } from '@/types/purchase'

export const purchaseKeys = {
  all: ['purchases'] as const,
  list: (filters: PurchaseFilters) => [...purchaseKeys.all, 'list', filters] as const,
  detail: (id: string) => [...purchaseKeys.all, 'detail', id] as const,
}

export function usePurchasesQuery(filters: PurchaseFilters) {
  return useQuery({
    queryKey: purchaseKeys.list(filters),
    queryFn: () => purchasesApi.list(filters),
  })
}

export function usePurchaseQuery(id: string | null) {
  return useQuery({
    queryKey: id ? purchaseKeys.detail(id) : [...purchaseKeys.all, 'detail', 'none'],
    queryFn: () => purchasesApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCreatePurchaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PurchasePayload) => purchasesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
    },
  })
}

export function useUpdatePurchaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PurchasePayload }) => purchasesApi.update(id, payload),
    onSuccess: (purchase) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(purchase.id) })
    },
  })
}

export function useDeletePurchaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => purchasesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
    },
  })
}

export function useReceivePurchaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReceivePurchasePayload }) => purchasesApi.receive(id, payload),
    onSuccess: (purchase) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(purchase.id) })
    },
  })
}
