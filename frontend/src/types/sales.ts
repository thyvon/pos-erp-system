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
  payments_count: number
  returns_count: number
  created_at: string
  updated_at: string
}

export interface SalePaymentPayload {
  payment_account_id: string
  amount: number
  method: SalePaymentMethod
  reference?: string | null
  payment_date: string
  note?: string | null
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
  method: SalePaymentMethod
  gift_card_id: string | null
  reference: string | null
  payment_date: string | null
  note: string | null
  payment_account?: {
    id: string
    name: string
    type: string
  } | null
  creator?: SaleUserRelation | null
  created_at: string
}

export interface SalePaymentResult {
  sale: Sale
  payment: SalePayment
  journal: unknown
}

export type SalesPaginatedResponse = PaginatedResponse<Sale>
