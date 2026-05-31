import type { Branch } from './branch'
import type { ChartOfAccount } from './accounting'

export type ExpensePaymentMethod = 'cash' | 'bank' | 'card' | 'other'

export interface ExpenseFilters {
  search?: string
  branch_id?: string
  expense_account_id?: string
  payment_account_id?: string
  date_from?: string | null
  date_to?: string | null
  page?: number
  per_page?: number
}

export interface ExpenseUser {
  id: string
  name: string
  email?: string | null
}

export interface Expense {
  id: string
  business_id: string
  branch_id: string
  expense_account_id: string
  payment_account_id: string
  expense_date: string
  reference_no: string | null
  description: string
  amount: string
  payment_method: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  branch?: Pick<Branch, 'id' | 'name' | 'code'> | null
  expense_account?: Pick<ChartOfAccount, 'id' | 'code' | 'name'> | null
  payment_account?: { id: string; name: string; type?: string } | null
  creator?: ExpenseUser | null
}

export interface ExpensePayload {
  branch_id: string
  expense_account_id: string
  payment_account_id: string
  expense_date: string
  reference_no?: string | null
  description: string
  amount: number
  payment_method?: string | null
  notes?: string | null
}
