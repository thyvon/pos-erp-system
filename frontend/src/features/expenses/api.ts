import { apiClient } from '@/api/client'
import type { Expense, ExpenseFilters, ExpensePayload } from '@/types/expense'

export const expensesApi = {
  list: (filters: ExpenseFilters = {}) => apiClient.getPaginated<Expense>('/v1/expenses', filters),
  show: (id: string) => apiClient.get<Expense>(`/v1/expenses/${id}`),
  create: (payload: ExpensePayload) => apiClient.post<Expense, ExpensePayload>('/v1/expenses', payload),
  update: (id: string, payload: ExpensePayload) =>
    apiClient.put<Expense, ExpensePayload>(`/v1/expenses/${id}`, payload),
  delete: (id: string) => apiClient.delete<void>(`/v1/expenses/${id}`),
}
