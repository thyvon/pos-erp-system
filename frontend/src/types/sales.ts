import type { PaginatedResponse } from './api'

export type SaleType = 'invoice' | 'pos_sale' | 'draft' | 'quotation' | 'suspended' | string
export type SaleStatus = 'draft' | 'quotation' | 'suspended' | 'confirmed' | 'completed' | 'cancelled' | 'returned' | string
export type SalePaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded' | string
export type SaleDeliveryStatus = 'pending' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | string
export type SalePaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'reward_points' | 'gift_card' | 'other'

export interface SaleFilters {
  search?: string
  status?: SaleStatus | ''
  type?: SaleType | ''
  branch_id?: string
  warehouse_id?: string
  customer_id?: string
  date_from?: string | null
  date_to?: string | null
  page?: number
  per_page?: number
}

export interface CashRegisterFilters {
  search?: string
  branch_id?: string
  status?: 'active' | 'inactive' | ''
  page?: number
  per_page?: number
}

export interface CashRegisterSession {
  id: string
  cash_register_id: string
  user_id: string
  opening_float: string | null
  closing_float: string | null
  denominations_at_close?: unknown
  total_sales: string | null
  status: 'open' | 'closed' | string
  opened_at: string | null
  closed_at: string | null
  notes: string | null
  cash_register?: {
    id: string
    name: string
    branch_id: string
    branch?: SaleRelation | null
  } | null
  user?: {
    id: string
    name: string
    email: string
  } | null
  created_at: string
  updated_at: string
}

export interface CashRegister {
  id: string
  business_id: string
  branch_id: string
  name: string
  is_active: boolean
  status: 'active' | 'inactive' | string
  branch?: SaleRelation | null
  sessions_count: number
  current_open_session?: CashRegisterSession | null
  recent_sessions?: CashRegisterSession[]
  created_at: string
  updated_at: string
}

export interface OpenCashRegisterSessionPayload {
  opening_float?: number | null
  notes?: string | null
}

export interface CreateCashRegisterPayload {
  branch_id: string
  name: string
  is_active?: boolean
}

export interface SaleItemPayload {
  product_id: string
  variation_id?: string | null
  sub_unit_id?: string | null
  quantity: number
  unit_price: number
  discount_type?: 'fixed' | 'percentage' | null
  discount_amount?: number | null
  tax_rate_id?: string | null
  tax_rate_type?: 'percentage' | 'fixed' | null
  tax_rate?: number | null
  tax_type?: 'inclusive' | 'exclusive' | null
  unit_cost?: number | null
  notes?: string | null
  lot_allocations?: Array<{
    lot_id: string
    quantity: number
  }>
  serial_ids?: string[]
}

export interface SalePayload {
  branch_id: string
  warehouse_id: string
  customer_id?: string | null
  cash_register_session_id?: string | null
  commission_agent_id?: string | null
  client_request_id?: string | null
  type?: SaleType | null
  sale_date: string
  due_date?: string | null
  discount_type?: 'fixed' | 'percentage' | null
  discount_amount?: number | null
  tax_scope?: 'line' | 'sale' | null
  tax_rate_id?: string | null
  tax_rate_type?: 'percentage' | 'fixed' | null
  tax_rate?: number | null
  tax_type?: 'inclusive' | 'exclusive' | null
  shipping_charges?: number | null
  price_group_id?: string | null
  notes?: string | null
  staff_note?: string | null
  items: SaleItemPayload[]
  payment_date?: string | null
  payment_note?: string | null
  payments?: SalePaymentLinePayload[]
}

export interface SaleRelation {
  id: string
  name: string
  code?: string | null
  phone?: string | null
}

export interface SaleUserRelation {
  id: string
  name: string
}

export interface SaleTaxRateRecord {
  id: string
  name: string
  type: string
  rate: number
}

export interface SaleUnit {
  id: string
  name: string
  short_name: string
  conversion_factor?: string | null
}

export interface SaleProductSummary {
  id: string
  name: string
  sku: string | null
  stock_tracking: string | null
  track_inventory: boolean
  selling_price: string | null
  sub_unit_selling_price: string | null
  minimum_selling_price: string | null
  unit?: SaleUnit | null
  sub_unit?: SaleUnit | null
}

export interface SaleVariationSummary {
  id: string
  name: string
  sku: string | null
  selling_price: string | null
  sub_unit_selling_price: string | null
  minimum_selling_price: string | null
  sub_unit?: SaleUnit | null
}

export interface SaleItemLot {
  id: string
  lot_id: string
  quantity: string | null
  unit_cost: string | null
  lot?: {
    id: string
    lot_number: string
    status: string
    expiry_date: string | null
  } | null
}

export interface SaleItemSerial {
  id: string
  serial_id: string
  serial?: {
    id: string
    serial_number: string
    status: string
  } | null
  created_at: string
}

export interface SaleItem {
  id: string
  product_id: string
  variation_id: string | null
  sub_unit_id: string | null
  quantity: string | null
  unit_price: string | null
  discount_type: string | null
  discount_amount: string | null
  tax_rate_id: string | null
  tax_rate_type: string | null
  tax_rate: string | null
  tax_type: string | null
  tax_amount: string | null
  unit_cost: string | null
  total_amount: string | null
  notes: string | null
  product?: SaleProductSummary | null
  variation?: SaleVariationSummary | null
  sub_unit?: SaleUnit | null
  tax_rate_record?: SaleTaxRateRecord | null
  lots?: SaleItemLot[]
  serials?: SaleItemSerial[]
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  business_id: string
  branch_id: string
  warehouse_id: string
  customer_id: string | null
  cash_register_session_id: string | null
  commission_agent_id: string | null
  parent_sale_id: string | null
  sale_number: string
  type: SaleType
  status: SaleStatus
  payment_status: SalePaymentStatus
  delivery_status: SaleDeliveryStatus | null
  is_recurring: boolean
  recurring_interval: string | null
  next_recurring_date: string | null
  recurring_count: number | null
  recurring_generated: number | null
  sale_date: string | null
  due_date: string | null
  subtotal: string | null
  discount_type: string | null
  discount_amount: string | null
  tax_scope: string | null
  tax_rate_id: string | null
  tax_rate_type: string | null
  tax_rate: string | null
  tax_type: string | null
  tax_amount: string | null
  shipping_charges: string | null
  total_amount: string | null
  paid_amount: string | null
  change_amount: string | null
  notes: string | null
  staff_note: string | null
  branch?: SaleRelation | null
  warehouse?: SaleRelation | null
  customer?: SaleRelation | null
  cash_register_session?: {
    id: string
    status: string
    opened_at: string | null
    cash_register?: SaleRelation | null
  } | null
  commission_agent?: SaleUserRelation | null
  parent_sale?: {
    id: string
    sale_number: string
    status: SaleStatus
  } | null
  creator?: SaleUserRelation | null
  price_group?: SaleRelation | null
  tax_rate_record?: SaleTaxRateRecord | null
  items?: SaleItem[]
  payments?: SalePayment[]
  payments_count: number
  returns_count: number
  created_at: string
  updated_at: string
}

export interface SalePaymentLinePayload {
  payment_account_id: string
  amount: number
  payment_currency?: 'USD' | 'KHR'
  payment_amount?: number
  exchange_rate_id?: string | null
  method: SalePaymentMethod
  reference?: string | null
  payment_date?: string
  note?: string | null
}

export interface SalePaymentCorrectionPayload extends SalePaymentLinePayload {
  payment_date: string
  reason: string
}

export interface SalePaymentCorrectionLinePayload extends SalePaymentCorrectionPayload {
  payment_id: string
}

export interface SalePaymentDeletionLinePayload {
  payment_id: string
  reason?: string | null
}

export interface SaleWithPaymentsPayload extends SalePayload {
  payment_corrections?: SalePaymentCorrectionLinePayload[]
  payment_deletions?: SalePaymentDeletionLinePayload[]
}

export interface SalePaymentDeletePayload {
  reason?: string | null
}

export interface SalePaymentPayload {
  payment_account_id?: string
  amount?: number
  payment_currency?: 'USD' | 'KHR'
  payment_amount?: number
  exchange_rate_id?: string | null
  method?: SalePaymentMethod
  reference?: string | null
  payment_date: string
  note?: string | null
  payments?: SalePaymentLinePayload[]
}

export interface SaleCancelPayload {
  reason?: string | null
}

export interface SalePayment {
  id: string
  business_id: string
  sale_id: string
  payment_account_id: string
  amount: string | null
  payment_currency: 'USD' | 'KHR'
  payment_amount: string | null
  exchange_rate_id: string | null
  exchange_rate: string | null
  method: SalePaymentMethod
  gift_card_id: string | null
  reference: string | null
  payment_date: string | null
  note: string | null
  status: 'completed' | 'reversed'
  replaces_payment_id: string | null
  reversed_by?: {
    id: string
    name: string
  } | null
  reversed_at: string | null
  reversal_reason: string | null
  payment_account?: {
    id: string
    name: string
    type: string
  } | null
  replaced_payment?: {
    id: string
    reference: string | null
    payment_date: string | null
  } | null
  creator?: SaleUserRelation | null
  created_at: string
}

export interface SalePaymentResult {
  sale: Sale
  payment: SalePayment
  payments?: SalePayment[]
  journal: unknown
  journals?: unknown[]
}

export interface SalePaymentCorrectionResult {
  sale: Sale
  payment: SalePayment
  reversed_payment: SalePayment
  journal: unknown
  reversal_journal: unknown
}

export interface SalePaymentDeleteResult {
  sale: Sale
  reversed_payment: SalePayment
  reversal_journal: unknown
}

export type SalesPaginatedResponse = PaginatedResponse<Sale>
