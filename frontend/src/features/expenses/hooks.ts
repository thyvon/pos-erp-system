'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expensesApi } from './api'
import type { ExpenseFilters, ExpensePayload } from '@/types/expense'

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (filters: ExpenseFilters) => [...expenseKeys.all, 'list', filters] as const,
  detail: (id: string) => [...expenseKeys.all, 'detail', id] as const,
}

export function useExpensesQuery(filters: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => expensesApi.list(filters),
  })
}

export function useExpenseQuery(id: string | null) {
  return useQuery({
    queryKey: id ? expenseKeys.detail(id) : [...expenseKeys.all, 'detail', 'none'],
    queryFn: () => expensesApi.show(id ?? ''),
    enabled: !!id,
  })
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ExpensePayload) => expensesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ExpensePayload }) =>
      expensesApi.update(id, payload),
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(expense.id) })
    },
  })
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}
