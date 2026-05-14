'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customerGroupsApi } from './api'
import type { CustomerGroupFilters, CustomerGroupPayload } from '@/types/customerGroup'

export const customerGroupKeys = {
  all: ['customer-groups'] as const,
  list: (filters: CustomerGroupFilters) => [...customerGroupKeys.all, 'list', filters] as const,
}

export function useCustomerGroupsQuery(filters: CustomerGroupFilters) {
  return useQuery({
    queryKey: customerGroupKeys.list(filters),
    queryFn: () => customerGroupsApi.list(filters),
  })
}

export function useCreateCustomerGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CustomerGroupPayload) => customerGroupsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerGroupKeys.all })
    },
  })
}

export function useUpdateCustomerGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerGroupPayload }) =>
      customerGroupsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerGroupKeys.all })
    },
  })
}

export function useDeleteCustomerGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => customerGroupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerGroupKeys.all })
    },
  })
}
