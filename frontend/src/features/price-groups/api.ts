import { apiClient } from '@/api/client'
import type { PriceGroup, PriceGroupFilters } from '@/types/priceGroup'

export const priceGroupsApi = {
  list: (filters: PriceGroupFilters = {}) =>
    apiClient.getPaginated<PriceGroup>('/v1/price-groups', filters),
}
