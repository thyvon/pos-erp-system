import { apiClient } from '@/api/client'
import type {
  AccountingPaginatedResponse,
  ChartOfAccount,
  ChartOfAccountFilters,
  ChartOfAccountPayload,
  ChartOfAccountSummary,
  Journal,
  JournalFilters,
  JournalPayload,
  JournalReversePayload,
  JournalSummary,
  PaymentAccount,
  PaymentAccountFilters,
  PaymentAccountPayload,
  PaymentAccountSummary,
  PaymentAccountTransferPayload,
  PaymentAccountTransferResult,
  FiscalYear,
  FiscalYearFilters,
  FiscalYearPayload,
  FiscalYearSummary,
} from '@/types/accounting'

export const chartOfAccountsApi = {
  list: (filters: ChartOfAccountFilters = {}) =>
    apiClient.getPaginated<ChartOfAccount>('/v1/accounting/chart-of-accounts', filters) as Promise<
      AccountingPaginatedResponse<ChartOfAccount, ChartOfAccountSummary>
    >,
  show: (id: string) => apiClient.get<ChartOfAccount>(`/v1/accounting/chart-of-accounts/${id}`),
  create: (payload: ChartOfAccountPayload) =>
    apiClient.post<ChartOfAccount, ChartOfAccountPayload>('/v1/accounting/chart-of-accounts', payload),
  update: (id: string, payload: ChartOfAccountPayload) =>
    apiClient.put<ChartOfAccount, ChartOfAccountPayload>(`/v1/accounting/chart-of-accounts/${id}`, payload),
  delete: (id: string) => apiClient.delete<void>(`/v1/accounting/chart-of-accounts/${id}`),
}

export const journalsApi = {
  list: (filters: JournalFilters = {}) =>
    apiClient.getPaginated<Journal>('/v1/accounting/journals', filters) as Promise<
      AccountingPaginatedResponse<Journal, JournalSummary>
    >,
  show: (id: string) => apiClient.get<Journal>(`/v1/accounting/journals/${id}`),
  create: (payload: JournalPayload) =>
    apiClient.post<Journal, JournalPayload>('/v1/accounting/journals', payload),
  reverse: (id: string, payload: JournalReversePayload) =>
    apiClient.post<Journal, JournalReversePayload>(`/v1/accounting/journals/${id}/reverse`, payload),
}

export const paymentAccountsApi = {
  list: (filters: PaymentAccountFilters = {}) =>
    apiClient.getPaginated<PaymentAccount>('/v1/accounting/payment-accounts', filters) as Promise<
      AccountingPaginatedResponse<PaymentAccount, PaymentAccountSummary>
    >,
  show: (id: string) => apiClient.get<PaymentAccount>(`/v1/accounting/payment-accounts/${id}`),
  create: (payload: PaymentAccountPayload) =>
    apiClient.post<PaymentAccount, PaymentAccountPayload>('/v1/accounting/payment-accounts', payload),
  update: (id: string, payload: PaymentAccountPayload) =>
    apiClient.put<PaymentAccount, PaymentAccountPayload>(`/v1/accounting/payment-accounts/${id}`, payload),
  delete: (id: string) => apiClient.delete<void>(`/v1/accounting/payment-accounts/${id}`),
  transfer: (payload: PaymentAccountTransferPayload) =>
    apiClient.post<PaymentAccountTransferResult, PaymentAccountTransferPayload>('/v1/accounting/payment-accounts/transfer', payload),
}

export const fiscalYearsApi = {
  list: (filters: FiscalYearFilters = {}) =>
    apiClient.getPaginated<FiscalYear>('/v1/accounting/fiscal-years', filters) as Promise<
      AccountingPaginatedResponse<FiscalYear, FiscalYearSummary>
    >,
  show: (id: string) => apiClient.get<FiscalYear>(`/v1/accounting/fiscal-years/${id}`),
  create: (payload: FiscalYearPayload) =>
    apiClient.post<FiscalYear, FiscalYearPayload>('/v1/accounting/fiscal-years', payload),
  update: (id: string, payload: FiscalYearPayload) =>
    apiClient.put<FiscalYear, FiscalYearPayload>(`/v1/accounting/fiscal-years/${id}`, payload),
  delete: (id: string) => apiClient.delete<void>(`/v1/accounting/fiscal-years/${id}`),
}
