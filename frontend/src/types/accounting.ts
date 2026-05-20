import type { PaginatedResponse } from './api'

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
export type AccountNormalBalance = 'debit' | 'credit'
export type AccountStatus = 'active' | 'inactive'
export type JournalStatus = 'posted' | 'reversed'
export type JournalType = 'manual' | 'reversal' | string
export type JournalEntryType = 'debit' | 'credit'
export type PaymentAccountType = 'cash' | 'bank' | 'other'
export type FiscalYearStatus = 'active' | 'closed'

export interface AccountingPaginatedResponse<T, TSummary> extends PaginatedResponse<T> {
  summary?: TSummary
}

export interface ChartOfAccountSummary {
  total_accounts: number
  postable_accounts: number
  system_accounts: number
  active_accounts: number
}

export interface ChartOfAccountParent {
  id: string
  code: string
  name: string
}

export interface ChartOfAccount {
  id: string
  business_id: string
  parent_id: string | null
  code: string
  name: string
  type: AccountType
  detail_type: string | null
  normal_balance: AccountNormalBalance
  description: string | null
  is_system: boolean
  is_active: boolean
  status: AccountStatus
  is_postable: boolean
  children_count: number | null
  journal_entries_count: number | null
  payment_accounts_count: number | null
  parent?: ChartOfAccountParent | null
  created_at: string
  updated_at: string
}

export interface ChartOfAccountPayload {
  parent_id?: string | null
  code: string
  name: string
  type: AccountType
  sub_type?: string | null
  normal_balance: AccountNormalBalance
  is_active?: boolean
  description?: string | null
}

export interface ChartOfAccountFilters {
  search?: string
  type?: AccountType | ''
  status?: AccountStatus | ''
  page?: number
  per_page?: number
}

export interface JournalSummary {
  total_journals: number
  posted_journals: number
  reversed_journals: number
  posted_volume: number
}

export interface JournalPoster {
  id: string
  name: string
}

export interface JournalReversal {
  id: string
  journal_number: string
}

export interface JournalEntryAccount {
  id: string
  code: string
  name: string
}

export interface JournalEntry {
  id: string
  account_id: string
  type: JournalEntryType
  amount: number
  description: string | null
  account?: JournalEntryAccount | null
  created_at: string
}

export interface Journal {
  id: string
  business_id: string
  fiscal_year_id: string | null
  journal_number: string
  journal_type: JournalType
  reference_type: string | null
  reference_id: string | null
  description: string
  total: number
  status: JournalStatus
  entry_count: number
  date: string
  poster?: JournalPoster | null
  reversed_by_id: string | null
  reversed_by?: JournalReversal | null
  entries?: JournalEntry[]
  created_at: string
}

export interface JournalPayload {
  fiscal_year_id?: string | null
  description: string
  posted_at?: string | null
  entries: Array<{
    account_id: string
    type: JournalEntryType
    amount: number
    description?: string | null
  }>
}

export interface JournalReversePayload {
  reason: string
}

export interface JournalFilters {
  search?: string
  status?: JournalStatus | ''
  journal_type?: string
  page?: number
  per_page?: number
}

export interface PaymentAccountSummary {
  total_accounts: number
  active_accounts: number
  bank_accounts: number
  linked_accounts: number
}

export interface PaymentAccountChartAccount {
  id: string
  code: string
  name: string
}

export interface PaymentAccount {
  id: string
  business_id: string
  name: string
  type: PaymentAccountType
  account_number: string | null
  bank_name: string | null
  opening_balance: number
  current_balance: number
  status: AccountStatus
  is_active: boolean
  note: string | null
  transactions_count: number | null
  chart_of_account?: PaymentAccountChartAccount | null
  created_at: string
  updated_at: string
}

export interface PaymentAccountPayload {
  name: string
  account_type: PaymentAccountType
  account_number?: string | null
  bank_name?: string | null
  opening_balance?: number
  coa_account_id?: string | null
  is_active?: boolean
  note?: string | null
}

export interface PaymentAccountTransferPayload {
  from_payment_account_id: string
  to_payment_account_id: string
  amount: number
  transaction_date: string
  note?: string | null
}

export interface PaymentAccountTransferResult {
  journal: Journal
  from_account: PaymentAccount
  to_account: PaymentAccount
}

export interface PaymentAccountFilters {
  search?: string
  type?: PaymentAccountType | ''
  status?: AccountStatus | ''
  page?: number
  per_page?: number
}

export interface FiscalYearSummary {
  total_years: number
  active_years: number
  closed_years: number
}

export interface FiscalYear {
  id: string
  business_id: string
  name: string
  start_date: string
  end_date: string
  status: FiscalYearStatus
  closed_at: string | null
  journal_count: number | null
  created_at: string
  updated_at: string
}

export interface FiscalYearPayload {
  name: string
  start_date: string
  end_date: string
  status: FiscalYearStatus
}

export interface FiscalYearFilters {
  search?: string
  status?: FiscalYearStatus | ''
  page?: number
  per_page?: number
}
