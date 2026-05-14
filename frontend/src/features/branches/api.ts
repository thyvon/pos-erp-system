import { apiClient } from '@/api/client'
import type { Branch, BranchFilters, BranchPayload } from '@/types/branch'

export const branchesApi = {
  list: (filters: BranchFilters = {}) =>
    apiClient.getPaginated<Branch>('/v1/branches', filters),
  create: (payload: BranchPayload) =>
    apiClient.post<Branch, BranchPayload>('/v1/branches', payload),
  update: (id: string, payload: BranchPayload) =>
    apiClient.put<Branch, BranchPayload>(`/v1/branches/${id}`, payload),
  delete: (id: string) => apiClient.delete<null>(`/v1/branches/${id}`),
}
