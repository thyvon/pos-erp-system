'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cashRegistersApi, salesApi } from './api'
import type {
  CashRegisterFilters,
  CloseCashRegisterSessionPayload,
  CreateCashRegisterPayload,
  OpenCashRegisterSessionPayload,
  SaleCancelPayload,
  SaleFilters,
  SalePayload,
  SalePaymentCorrectionPayload,
  SalePaymentDeletePayload,
  SalePaymentPayload,
  SaleWithPaymentsPayload,
  UpdateCashRegisterPayload,
} from '@/types/sales'

export const saleKeys = {
  all: ['sales'] as const,
  list: (filters: SaleFilters) => [...saleKeys.all, 'list', filters] as const,
  detail: (id: string) => [...saleKeys.all, 'detail', id] as const,
}

export const cashRegisterKeys = {
  all: ['cash-registers'] as const,
  list: (filters: CashRegisterFilters) => [...cashRegisterKeys.all, 'list', filters] as const,
  detail: (id: string) => [...cashRegisterKeys.all, 'detail', id] as const,
}

export function useSalesQuery(filters: SaleFilters) {
  return useQuery({
    queryKey: saleKeys.list(filters),
    queryFn: () => salesApi.list(filters),
  })
}

export function useSaleQuery(id: string | null) {
  return useQuery({
    queryKey: id ? saleKeys.detail(id) : [...saleKeys.all, 'detail', 'none'],
    queryFn: () => salesApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCashRegistersQuery(filters: CashRegisterFilters) {
  return useQuery({
    queryKey: cashRegisterKeys.list(filters),
    queryFn: () => cashRegistersApi.list(filters),
  })
}

export function useCashRegisterQuery(id: string | null) {
  return useQuery({
    queryKey: id ? cashRegisterKeys.detail(id) : [...cashRegisterKeys.all, 'detail', 'none'],
    queryFn: () => cashRegistersApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCreateCashRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCashRegisterPayload) => cashRegistersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashRegisterKeys.all })
    },
  })
}

export function useUpdateCashRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCashRegisterPayload }) =>
      cashRegistersApi.update(id, payload),
    onSuccess: (register) => {
      queryClient.invalidateQueries({ queryKey: cashRegisterKeys.all })
      queryClient.invalidateQueries({ queryKey: cashRegisterKeys.detail(register.id) })
    },
  })
}

export function useDeleteCashRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => cashRegistersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashRegisterKeys.all })
    },
  })
}

export function useOpenCashRegisterSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: OpenCashRegisterSessionPayload }) =>
      cashRegistersApi.openSession(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashRegisterKeys.all })
    },
  })
}

export function useCloseCashRegisterSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: CloseCashRegisterSessionPayload }) =>
      cashRegistersApi.closeSession(sessionId, payload),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: cashRegisterKeys.all })
      queryClient.invalidateQueries({ queryKey: cashRegisterKeys.detail(session.cash_register_id) })
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
    },
  })
}

export function useCreateSaleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SalePayload) => salesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
    },
  })
}

export function useUpdateSaleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SalePayload }) => salesApi.update(id, payload),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(sale.id) })
    },
  })
}

export function useUpdateSaleWithPaymentsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaleWithPaymentsPayload }) =>
      salesApi.updateWithPayments(id, payload),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(sale.id) })
    },
  })
}

export function useDeleteSaleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => salesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
    },
  })
}

export function useConfirmSaleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => salesApi.confirm(id),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(sale.id) })
    },
  })
}

export function useCompleteSaleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => salesApi.complete(id),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(sale.id) })
    },
  })
}

export function useCancelSaleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaleCancelPayload }) => salesApi.cancel(id, payload),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(sale.id) })
    },
  })
}

export function useRecordSalePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SalePaymentPayload }) => salesApi.recordPayment(id, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(result.sale.id) })
    },
  })
}

export function useUpdateSalePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      saleId,
      paymentId,
      payload,
    }: {
      saleId: string
      paymentId: string
      payload: SalePaymentCorrectionPayload
    }) => salesApi.updatePayment(saleId, paymentId, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(result.sale.id) })
    },
  })
}

export function useDeleteSalePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      saleId,
      paymentId,
      payload,
    }: {
      saleId: string
      paymentId: string
      payload?: SalePaymentDeletePayload
    }) => salesApi.deletePayment(saleId, paymentId, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(result.sale.id) })
    },
  })
}
