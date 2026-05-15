import { apiClient } from '@/api/client'
import type {
  VariationTemplate,
  VariationTemplateFilters,
  VariationTemplatePayload,
} from '@/types/variationTemplate'

export const variationTemplatesApi = {
  list: (filters: VariationTemplateFilters = {}) =>
    apiClient.getPaginated<VariationTemplate>('/v1/variation-templates', filters),
  options: () => apiClient.get<VariationTemplate[]>('/v1/variation-templates/options'),
  create: (payload: VariationTemplatePayload) =>
    apiClient.post<VariationTemplate, VariationTemplatePayload>('/v1/variation-templates', payload),
  update: (id: string, payload: VariationTemplatePayload) =>
    apiClient.put<VariationTemplate, VariationTemplatePayload>(`/v1/variation-templates/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/variation-templates/${id}`),
}
