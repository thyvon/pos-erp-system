'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customFieldsApi } from './api'
import type { CustomFieldFilters, CustomFieldPayload } from '@/types/customField'

export const customFieldKeys = {
  all: ['custom-fields'] as const,
  list: (filters: CustomFieldFilters) => [...customFieldKeys.all, 'list', filters] as const,
}

export function useCustomFieldsQuery(filters: CustomFieldFilters, enabled = true) {
  return useQuery({
    queryKey: customFieldKeys.list(filters),
    queryFn: () => customFieldsApi.list(filters),
    enabled,
  })
}

export function useCreateCustomFieldMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CustomFieldPayload) => customFieldsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.all })
    },
  })
}

export function useUpdateCustomFieldMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomFieldPayload }) =>
      customFieldsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.all })
    },
  })
}

export function useDeleteCustomFieldMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => customFieldsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.all })
    },
  })
}
