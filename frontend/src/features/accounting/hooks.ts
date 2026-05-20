'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chartOfAccountsApi, fiscalYearsApi, journalsApi, paymentAccountsApi } from './api'
import type {
  ChartOfAccountFilters,
  ChartOfAccountPayload,
  JournalFilters,
  JournalPayload,
  JournalReversePayload,
  PaymentAccountFilters,
  PaymentAccountPayload,
  PaymentAccountTransferPayload,
  FiscalYearFilters,
  FiscalYearPayload,
} from '@/types/accounting'

export const chartOfAccountKeys = {
  all: ['chart-of-accounts'] as const,
  list: (filters: ChartOfAccountFilters) => [...chartOfAccountKeys.all, 'list', filters] as const,
  detail: (id: string) => [...chartOfAccountKeys.all, 'detail', id] as const,
}

export const journalKeys = {
  all: ['journals'] as const,
  list: (filters: JournalFilters) => [...journalKeys.all, 'list', filters] as const,
  detail: (id: string) => [...journalKeys.all, 'detail', id] as const,
}

export const paymentAccountKeys = {
  all: ['payment-accounts'] as const,
  list: (filters: PaymentAccountFilters) => [...paymentAccountKeys.all, 'list', filters] as const,
  detail: (id: string) => [...paymentAccountKeys.all, 'detail', id] as const,
}

export const fiscalYearKeys = {
  all: ['fiscal-years'] as const,
  list: (filters: FiscalYearFilters) => [...fiscalYearKeys.all, 'list', filters] as const,
  detail: (id: string) => [...fiscalYearKeys.all, 'detail', id] as const,
}

export function useChartOfAccountsQuery(filters: ChartOfAccountFilters) {
  return useQuery({
    queryKey: chartOfAccountKeys.list(filters),
    queryFn: () => chartOfAccountsApi.list(filters),
  })
}

export function useChartOfAccountQuery(id: string | null) {
  return useQuery({
    queryKey: id ? chartOfAccountKeys.detail(id) : [...chartOfAccountKeys.all, 'detail', 'none'],
    queryFn: () => chartOfAccountsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCreateChartOfAccountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ChartOfAccountPayload) => chartOfAccountsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chartOfAccountKeys.all })
    },
  })
}

export function useUpdateChartOfAccountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ChartOfAccountPayload }) =>
      chartOfAccountsApi.update(id, payload),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: chartOfAccountKeys.all })
      queryClient.invalidateQueries({ queryKey: chartOfAccountKeys.detail(account.id) })
    },
  })
}

export function useDeleteChartOfAccountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => chartOfAccountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chartOfAccountKeys.all })
    },
  })
}

export function useJournalsQuery(filters: JournalFilters) {
  return useQuery({
    queryKey: journalKeys.list(filters),
    queryFn: () => journalsApi.list(filters),
  })
}

export function useJournalQuery(id: string | null) {
  return useQuery({
    queryKey: id ? journalKeys.detail(id) : [...journalKeys.all, 'detail', 'none'],
    queryFn: () => journalsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCreateJournalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: JournalPayload) => journalsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.all })
      queryClient.invalidateQueries({ queryKey: chartOfAccountKeys.all })
    },
  })
}

export function useReverseJournalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: JournalReversePayload }) =>
      journalsApi.reverse(id, payload),
    onSuccess: (journal) => {
      queryClient.invalidateQueries({ queryKey: journalKeys.all })
      queryClient.invalidateQueries({ queryKey: journalKeys.detail(journal.id) })
    },
  })
}

export function usePaymentAccountsQuery(filters: PaymentAccountFilters) {
  return useQuery({
    queryKey: paymentAccountKeys.list(filters),
    queryFn: () => paymentAccountsApi.list(filters),
  })
}

export function usePaymentAccountQuery(id: string | null) {
  return useQuery({
    queryKey: id ? paymentAccountKeys.detail(id) : [...paymentAccountKeys.all, 'detail', 'none'],
    queryFn: () => paymentAccountsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCreatePaymentAccountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PaymentAccountPayload) => paymentAccountsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentAccountKeys.all })
    },
  })
}

export function useUpdatePaymentAccountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PaymentAccountPayload }) =>
      paymentAccountsApi.update(id, payload),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: paymentAccountKeys.all })
      queryClient.invalidateQueries({ queryKey: paymentAccountKeys.detail(account.id) })
    },
  })
}

export function useDeletePaymentAccountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => paymentAccountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentAccountKeys.all })
    },
  })
}

export function useTransferPaymentAccountMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PaymentAccountTransferPayload) => paymentAccountsApi.transfer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentAccountKeys.all })
      queryClient.invalidateQueries({ queryKey: journalKeys.all })
    },
  })
}

export function useFiscalYearsQuery(filters: FiscalYearFilters) {
  return useQuery({
    queryKey: fiscalYearKeys.list(filters),
    queryFn: () => fiscalYearsApi.list(filters),
  })
}

export function useFiscalYearQuery(id: string | null) {
  return useQuery({
    queryKey: id ? fiscalYearKeys.detail(id) : [...fiscalYearKeys.all, 'detail', 'none'],
    queryFn: () => fiscalYearsApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCreateFiscalYearMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: FiscalYearPayload) => fiscalYearsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fiscalYearKeys.all })
    },
  })
}

export function useUpdateFiscalYearMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FiscalYearPayload }) =>
      fiscalYearsApi.update(id, payload),
    onSuccess: (year) => {
      queryClient.invalidateQueries({ queryKey: fiscalYearKeys.all })
      queryClient.invalidateQueries({ queryKey: fiscalYearKeys.detail(year.id) })
    },
  })
}

export function useDeleteFiscalYearMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => fiscalYearsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fiscalYearKeys.all })
    },
  })
}
