'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { taxRatesApi } from './api'
import type { TaxRateFilters, TaxRatePayload } from '@/types/taxRate'

export const taxRateKeys = {
  all: ['tax-rates'] as const,
  list: (filters: TaxRateFilters) => [...taxRateKeys.all, 'list', filters] as const,
}

export function useTaxRatesQuery(filters: TaxRateFilters) {
  return useQuery({
    queryKey: taxRateKeys.list(filters),
    queryFn: () => taxRatesApi.list(filters),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateTaxRateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TaxRatePayload) => taxRatesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxRateKeys.all })
    },
  })
}

export function useUpdateTaxRateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TaxRatePayload }) =>
      taxRatesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxRateKeys.all })
    },
  })
}

export function useDeleteTaxRateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => taxRatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxRateKeys.all })
    },
  })
}
