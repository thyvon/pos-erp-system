'use client'

import { useQuery } from '@tanstack/react-query'
import { priceGroupsApi } from './api'
import type { PriceGroupFilters } from '@/types/priceGroup'

export const priceGroupKeys = {
  all: ['price-groups'] as const,
  list: (filters: PriceGroupFilters) => [...priceGroupKeys.all, 'list', filters] as const,
}

export function usePriceGroupsQuery(filters: PriceGroupFilters) {
  return useQuery({
    queryKey: priceGroupKeys.list(filters),
    queryFn: () => priceGroupsApi.list(filters),
  })
}
