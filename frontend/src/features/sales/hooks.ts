'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cashRegistersApi, quotationsApi, saleReturnsApi, salesApi } from './api'
import type {
  CashRegisterFilters,
  CloseCashRegisterSessionPayload,
  CreateCashRegisterPayload,
  OpenCashRegisterSessionPayload,
  QuotationConvertPayload,
  SaleCancelPayload,
  SaleFilters,
  SalePayload,
  SalePaymentCorrectionPayload,
  SalePaymentDeletePayload,
  SalePaymentPayload,
  SaleReturnFilters,
  SaleReturnPayload,
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

export const saleReturnKeys = {
  all: ['sale-returns'] as const,
  list: (filters: SaleReturnFilters) => [...saleReturnKeys.all, 'list', filters] as const,
  detail: (id: string) => [...saleReturnKeys.all, 'detail', id] as const,
}

export const quotationKeys = {
  all: ['quotations'] as const,
  list: (filters: SaleFilters) => [...quotationKeys.all, 'list', filters] as const,
  detail: (id: string) => [...quotationKeys.all, 'detail', id] as const,
}

export function useSalesQuery(filters: SaleFilters, enabled = true) {
  return useQuery({
    queryKey: saleKeys.list(filters),
    queryFn: () => salesApi.list(filters),
    enabled,
  })
}

export function useSaleQuery(id: string | null) {
  return useQuery({
    queryKey: id ? saleKeys.detail(id) : [...saleKeys.all, 'detail', 'none'],
    queryFn: () => salesApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useQuotationsQuery(filters: SaleFilters) {
  return useQuery({
    queryKey: quotationKeys.list(filters),
    queryFn: () => quotationsApi.list(filters),
  })
}

export function useQuotationQuery(id: string | null) {
  return useQuery({
    queryKey: id ? quotationKeys.detail(id) : [...quotationKeys.all, 'detail', 'none'],
    queryFn: () => quotationsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useSaleReturnsQuery(filters: SaleReturnFilters) {
  return useQuery({
    queryKey: saleReturnKeys.list(filters),
    queryFn: () => saleReturnsApi.list(filters),
  })
}

export function useSaleReturnQuery(id: string | null) {
  return useQuery({
    queryKey: id ? saleReturnKeys.detail(id) : [...saleReturnKeys.all, 'detail', 'none'],
    queryFn: () => saleReturnsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCashRegistersQuery(filters: CashRegisterFilters, enabled = true) {
  return useQuery({
    queryKey: cashRegisterKeys.list(filters),
    queryFn: () => cashRegistersApi.list(filters),
    enabled,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCashRegisterQuery(id: string | null) {
  return useQuery({
    queryKey: id ? cashRegisterKeys.detail(id) : [...cashRegisterKeys.all, 'detail', 'none'],
    queryFn: () => cashRegistersApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCreateQuotationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SalePayload) => quotationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
    },
  })
}

export function useConvertQuotationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: QuotationConvertPayload }) =>
      quotationsApi.convert(id, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all })
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(result.quotation.id) })
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(result.sale.id) })
    },
  })
}

export function useCancelQuotationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaleCancelPayload }) =>
      quotationsApi.cancel(id, payload),
    onSuccess: (quotation) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all })
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(quotation.id) })
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
    },
  })
}

export function useCreateSaleReturnMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ saleId, payload }: { saleId: string; payload: SaleReturnPayload }) =>
      saleReturnsApi.create(saleId, payload),
    onSuccess: (saleReturn) => {
      queryClient.invalidateQueries({ queryKey: saleReturnKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.all })
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(saleReturn.sale_id) })
    },
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
