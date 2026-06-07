export type ReportType =
  | 'sales'
  | 'salesReturns'
  | 'purchases'
  | 'purchaseReturns'
  | 'salePayments'
  | 'purchasePayments'
  | 'stock'
  | 'expenses'
  | 'cashRegisters'

export const reportTypes: ReportType[] = [
  'sales',
  'salesReturns',
  'purchases',
  'purchaseReturns',
  'salePayments',
  'purchasePayments',
  'stock',
  'expenses',
  'cashRegisters',
]

export const rowsPerPageOptions = [10, 25, 50]
export const saleStatuses = ['draft', 'confirmed', 'completed', 'cancelled', 'returned']
export const saleReturnStatuses = ['draft', 'completed']
export const paymentStatuses = ['unpaid', 'partial', 'paid', 'refunded']
export const purchaseStatuses = ['draft', 'confirmed', 'partially_received', 'received', 'cancelled']
export const purchasePaymentStatuses = ['unpaid', 'partial', 'paid']
export const cashRegisterStatuses = ['open', 'closed']
export const saleTypes = ['invoice', 'pos_sale', 'draft', 'suspended']
export const refundMethods = ['cash', 'credit_note', 'bank_transfer', 'reward_points']
export const paymentRecordStatuses = ['completed', 'reversed']
export const paymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other']
export const expensePaymentMethods = ['cash', 'bank', 'card', 'other']
export const stockModes = ['all', 'positive', 'zero', 'negative', 'low']
