import { z } from 'zod'

const optionalText = z.string().trim().max(500).optional().or(z.literal(''))
const requiredNumber = z.coerce.number().positive('Amount must be positive')

export const expenseSchema = z.object({
  branch_id: z.string().uuid('Branch is required'),
  expense_account_id: z.string().uuid('Expense account is required'),
  payment_account_id: z.string().uuid('Payment account is required'),
  expense_date: z.string().min(1, 'Expense date is required'),
  reference_no: z.string().trim().max(80).optional().or(z.literal('')),
  description: z.string().min(1, 'Description is required').max(500),
  amount: requiredNumber,
  payment_method: z.string().optional().or(z.literal('')),
  notes: optionalText,
})

export type ExpenseFormInput = z.input<typeof expenseSchema>
export type ExpenseFormValues = z.output<typeof expenseSchema>

export const emptyExpenseValues: ExpenseFormInput = {
  branch_id: '',
  expense_account_id: '',
  payment_account_id: '',
  expense_date: '',
  reference_no: '',
  description: '',
  amount: '',
  payment_method: '',
  notes: '',
}

export function valuesFromExpense(expense: {
  branch_id: string
  expense_account_id: string
  payment_account_id: string
  expense_date: string
  reference_no?: string | null
  description: string
  amount: string | number
  payment_method?: string | null
  notes?: string | null
}): ExpenseFormInput {
  return {
    branch_id: expense.branch_id,
    expense_account_id: expense.expense_account_id,
    payment_account_id: expense.payment_account_id,
    expense_date: expense.expense_date,
    reference_no: expense.reference_no ?? '',
    description: expense.description,
    amount: typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount,
    payment_method: expense.payment_method ?? '',
    notes: expense.notes ?? '',
  }
}
