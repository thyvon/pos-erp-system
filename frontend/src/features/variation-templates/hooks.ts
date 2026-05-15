'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { variationTemplatesApi } from './api'
import type {
  VariationTemplateFilters,
  VariationTemplatePayload,
} from '@/types/variationTemplate'

export const variationTemplateKeys = {
  all: ['variation-templates'] as const,
  list: (filters: VariationTemplateFilters) =>
    [...variationTemplateKeys.all, 'list', filters] as const,
  options: () => [...variationTemplateKeys.all, 'options'] as const,
}

export function useVariationTemplatesQuery(filters: VariationTemplateFilters) {
  return useQuery({
    queryKey: variationTemplateKeys.list(filters),
    queryFn: () => variationTemplatesApi.list(filters),
  })
}

export function useVariationTemplateOptionsQuery() {
  return useQuery({
    queryKey: variationTemplateKeys.options(),
    queryFn: () => variationTemplatesApi.options(),
  })
}

export function useCreateVariationTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: VariationTemplatePayload) => variationTemplatesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variationTemplateKeys.all })
    },
  })
}

export function useUpdateVariationTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VariationTemplatePayload }) =>
      variationTemplatesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variationTemplateKeys.all })
    },
  })
}

export function useDeleteVariationTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => variationTemplatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variationTemplateKeys.all })
    },
  })
}
