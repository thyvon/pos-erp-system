import { z } from 'zod'

export const chartOfAccountSchema = z.object({
  parent_id: z.string().nullable().optional(),
  code: z.string().trim().min(1, 'Code is required').max(20, 'Code must be 20 characters or less'),
  name: z.string().trim().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  sub_type: z.string().trim().max(50, 'Detail type must be 50 characters or less').nullable().optional(),
  normal_balance: z.enum(['debit', 'credit']),
  is_active: z.boolean(),
  description: z.string().trim().nullable().optional(),
})

export type ChartOfAccountFormInput = z.input<typeof chartOfAccountSchema>
export type ChartOfAccountFormValues = z.output<typeof chartOfAccountSchema>

const journalEntrySchema = z.object({
  account_id: z.string().min(1, 'Account is required'),
  type: z.enum(['debit', 'credit']),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than zero'),
  description: z.string().trim().nullable().optional(),
})

export const journalSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(500, 'Description must be 500 characters or less'),
  posted_at: z.string().nullable().optional(),
  entries: z.array(journalEntrySchema).min(2, 'At least two journal lines are required'),
}).superRefine((values, context) => {
  const debit = values.entries
    .filter((entry) => entry.type === 'debit')
    .reduce((total, entry) => total + entry.amount, 0)
  const credit = values.entries
    .filter((entry) => entry.type === 'credit')
    .reduce((total, entry) => total + entry.amount, 0)

  if (Math.round(debit * 100) !== Math.round(credit * 100)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debit and credit totals must match',
      path: ['entries'],
    })
  }
})

export type JournalFormInput = z.input<typeof journalSchema>
export type JournalFormValues = z.output<typeof journalSchema>

export const reverseJournalSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(500, 'Reason must be 500 characters or less'),
})

export type ReverseJournalFormInput = z.input<typeof reverseJournalSchema>
export type ReverseJournalFormValues = z.output<typeof reverseJournalSchema>

export const paymentAccountSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  account_type: z.enum(['cash', 'bank', 'other']),
  account_number: z.string().trim().max(50, 'Account number must be 50 characters or less').nullable().optional(),
  bank_name: z.string().trim().max(100, 'Bank name must be 100 characters or less').nullable().optional(),
  opening_balance: z.coerce.number().min(0, 'Opening balance cannot be negative'),
  coa_account_id: z.string().nullable().optional(),
  is_active: z.boolean(),
  note: z.string().trim().nullable().optional(),
})

export type PaymentAccountFormInput = z.input<typeof paymentAccountSchema>
export type PaymentAccountFormValues = z.output<typeof paymentAccountSchema>

export const paymentAccountTransferSchema = z.object({
  from_payment_account_id: z.string().min(1, 'Source account is required'),
  to_payment_account_id: z.string().min(1, 'Destination account is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than zero'),
  transaction_date: z.string().min(1, 'Transaction date is required'),
  note: z.string().trim().max(500, 'Note must be 500 characters or less').nullable().optional(),
}).refine(
  (values) => values.from_payment_account_id !== values.to_payment_account_id,
  {
    message: 'Source and destination must be different',
    path: ['to_payment_account_id'],
  }
)

export type PaymentAccountTransferFormInput = z.input<typeof paymentAccountTransferSchema>
export type PaymentAccountTransferFormValues = z.output<typeof paymentAccountTransferSchema>

export const fiscalYearSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  status: z.enum(['active', 'closed']),
}).refine(
  (values) => !values.start_date || !values.end_date || values.end_date >= values.start_date,
  {
    message: 'End date must be after or equal to start date',
    path: ['end_date'],
  }
)

export type FiscalYearFormInput = z.input<typeof fiscalYearSchema>
export type FiscalYearFormValues = z.output<typeof fiscalYearSchema>

export const exchangeRateSchema = z.object({
  from_currency: z.enum(['USD']),
  to_currency: z.enum(['KHR']),
  rate: z.coerce.number().gt(0, 'Rate must be greater than zero'),
  effective_date: z.string().min(1, 'Effective date is required'),
  is_default: z.boolean(),
  note: z.string().trim().nullable().optional(),
})

export type ExchangeRateFormInput = z.input<typeof exchangeRateSchema>
export type ExchangeRateFormValues = z.output<typeof exchangeRateSchema>
