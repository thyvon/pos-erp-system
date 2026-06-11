'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { purchaseReceivesApi, purchaseReturnsApi, purchasesApi } from './api'
import type { PurchaseFilters, PurchasePayload, PurchasePaymentCorrectionPayload, PurchasePaymentDeletePayload, PurchasePaymentPayload, PurchaseReturnFilters, PurchaseReturnPayload, ReceivePurchasePayload, UpdatePurchaseReceivePayload } from '@/types/purchase'

export const purchaseKeys = {
  all: ['purchases'] as const,
  list: (filters: PurchaseFilters) => [...purchaseKeys.all, 'list', filters] as const,
  detail: (id: string) => [...purchaseKeys.all, 'detail', id] as const,
}

export const purchaseReceiveKeys = {
  all: ['purchase-receives'] as const,
  detail: (purchaseId: string, receiveId: string) => [...purchaseReceiveKeys.all, 'detail', purchaseId, receiveId] as const,
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

export const purchaseReturnKeys = {
  all: ['purchase-returns'] as const,
  list: (filters: PurchaseReturnFilters) => [...purchaseReturnKeys.all, 'list', filters] as const,
  detail: (id: string) => [...purchaseReturnKeys.all, 'detail', id] as const,
}

export function usePurchaseReturnsQuery(filters: PurchaseReturnFilters) {
  return useQuery({
    queryKey: purchaseReturnKeys.list(filters),
    queryFn: () => purchaseReturnsApi.list(filters),
  })
}

export function usePurchaseReturnQuery(id: string | null) {
  return useQuery({
    queryKey: id ? purchaseReturnKeys.detail(id) : [...purchaseReturnKeys.all, 'detail', 'none'],
    queryFn: () => purchaseReturnsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCreatePurchaseReturnMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ purchaseId, payload }: { purchaseId: string; payload: PurchaseReturnPayload }) =>
      purchaseReturnsApi.create(purchaseId, payload),
    onSuccess: (purchaseReturn) => {
      queryClient.invalidateQueries({ queryKey: purchaseReturnKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(purchaseReturn.purchase_id) })
    },
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

export function useRecordPurchasePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PurchasePaymentPayload }) => purchasesApi.recordPayment(id, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(result.purchase.id) })
    },
  })
}

export function useUpdatePurchasePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ purchaseId, paymentId, payload }: { purchaseId: string; paymentId: string; payload: PurchasePaymentCorrectionPayload }) =>
      purchasesApi.updatePayment(purchaseId, paymentId, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(result.purchase.id) })
    },
  })
}

export function useDeletePurchasePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ purchaseId, paymentId, payload }: { purchaseId: string; paymentId: string; payload: PurchasePaymentDeletePayload }) =>
      purchasesApi.deletePayment(purchaseId, paymentId, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(result.purchase.id) })
    },
  })
}

export function usePurchaseReceiveQuery(purchaseId: string, receiveId: string | null) {
  return useQuery({
    queryKey: purchaseReceiveKeys.detail(purchaseId, receiveId!),
    queryFn: () => purchaseReceivesApi.show(purchaseId, receiveId!),
    enabled: !!receiveId,
  })
}

export function useUpdatePurchaseReceiveMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ purchaseId, receiveId, payload }: { purchaseId: string; receiveId: string; payload: UpdatePurchaseReceivePayload }) =>
      purchaseReceivesApi.update(purchaseId, receiveId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseReceiveKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
    },
  })
}

export function useDeletePurchaseReceiveMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ purchaseId, receiveId }: { purchaseId: string; receiveId: string }) =>
      purchaseReceivesApi.delete(purchaseId, receiveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseReceiveKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
    },
  })
}

export function useDeletePurchaseReceiveItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ purchaseId, receiveId, itemId }: { purchaseId: string; receiveId: string; itemId: string }) =>
      purchaseReceivesApi.deleteItem(purchaseId, receiveId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseReceiveKeys.all })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
    },
  })
}
