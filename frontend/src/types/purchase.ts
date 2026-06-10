import type { Branch } from './branch'
import type { Product, ProductVariation } from './product'
import type { Supplier } from './supplier'
import type { Warehouse } from './warehouse'

export type PurchaseStatus = 'draft' | 'confirmed' | 'partially_received' | 'received' | 'cancelled'
export type PurchasePaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface PurchaseFilters {
  search?: string
  branch_id?: string
  warehouse_id?: string
  supplier_id?: string
  status?: PurchaseStatus | ''
  payment_status?: PurchasePaymentStatus | ''
  date_from?: string | null
  date_to?: string | null
  page?: number
  per_page?: number
}

export interface PurchaseUser {
  id: string
  name: string
  email?: string | null
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string
  variation_id: string | null
  sub_unit_id: string | null
  quantity: string
  received_quantity: string
  unit_cost: string
  discount_type: string | null
  discount_amount: string
  tax_rate_id: string | null
  tax_rate: string
  tax_amount: string
  total_amount: string
  notes: string | null
  unit_label: string | null
  product?: Pick<Product, 'id' | 'name' | 'sku' | 'type' | 'stock_tracking' | 'has_expiry'> & { unit?: { id: string; name: string; short_name: string | null } | null } | null
  variation?: Pick<ProductVariation, 'id' | 'name' | 'sku'> | null
  sub_unit?: { id: string; name: string; short_name: string | null; conversion_factor: string | null } | null
  tax_rate_info?: { id: string; name: string; rate: string; type: string } | null
  return_lots?: PurchaseReturnLotOption[]
  return_serials?: PurchaseReturnSerialOption[]
}

export interface PurchaseReturnLotOption {
  id: string
  lot_number: string
  qty_on_hand: string | number
  expiry_date: string | null
}

export interface PurchaseReturnSerialOption {
  id: string
  serial_number: string
}

export interface Purchase {
  id: string
  business_id: string
  branch_id: string
  warehouse_id: string
  supplier_id: string
  created_by: string | null
  received_by: string | null
  purchase_number: string
  supplier_invoice_no: string | null
  status: PurchaseStatus
  payment_status: PurchasePaymentStatus
  purchase_date: string
  expected_date: string | null
  received_at: string | null
  subtotal: string
  discount_type: string | null
  discount_amount: string
  tax_scope: string
  tax_rate_id: string | null
  tax_rate_type: string | null
  tax_rate: string
  tax_type: string | null
  tax_amount: string
  shipping_charges: string
  total_amount: string
  paid_amount: string
  returned_amount?: string
  net_payable_amount?: string
  due_amount?: string
  notes: string | null
  staff_note: string | null
  branch?: Pick<Branch, 'id' | 'name' | 'code'> | null
  warehouse?: Pick<Warehouse, 'id' | 'name' | 'code' | 'branch_id'> | null
  supplier?: Pick<Supplier, 'id' | 'name' | 'code' | 'company' | 'phone'> | null
  creator?: PurchaseUser | null
  receiver?: PurchaseUser | null
  items: PurchaseItem[]
  payments?: PurchasePayment[]
  receives?: PurchaseReceive[]
  created_at: string
  updated_at: string
}

export interface PurchaseItemPayload {
  product_id: string
  variation_id?: string | null
  sub_unit_id?: string | null
  quantity: number
  unit_cost: number
  discount_type?: string | null
  discount_amount?: number | null
  tax_rate_id?: string | null
  tax_rate?: number | null
  notes?: string | null
}

export interface PurchasePayload {
  branch_id: string
  warehouse_id: string
  supplier_id: string
  supplier_invoice_no?: string | null
  status?: 'draft' | 'confirmed'
  purchase_date: string
  expected_date?: string | null
  discount_type?: string | null
  discount_amount?: number | null
  tax_scope?: string
  tax_rate_id?: string | null
  tax_rate_type?: string | null
  tax_rate?: number | null
  tax_type?: string | null
  shipping_charges?: number | null
  notes?: string | null
  staff_note?: string | null
  items: PurchaseItemPayload[]
}

export interface ReceivePurchaseItemPayload {
  purchase_item_id: string
  quantity: number
  lot_number?: string | null
  manufacture_date?: string | null
  expiry_date?: string | null
  serial_numbers?: string[]
  warranty_expires?: string | null
  notes?: string | null
}

export interface ReceivePurchasePayload {
  received_at?: string | null
  notes?: string | null
  items: ReceivePurchaseItemPayload[]
}

export type PurchasePaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'reward_points' | 'gift_card' | 'other'

export interface PurchasePayment {
  id: string
  business_id: string
  purchase_id: string
  payment_account_id: string
  amount: string | null
  payment_currency: 'USD' | 'KHR'
  payment_amount: string | null
  exchange_rate_id: string | null
  exchange_rate: string | null
  method: PurchasePaymentMethod
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
  creator?: PurchaseUser | null
  created_at: string
}

export interface PurchasePaymentLinePayload {
  payment_account_id: string
  amount: number
  payment_currency?: 'USD' | 'KHR'
  payment_amount?: number
  exchange_rate_id?: string | null
  method: PurchasePaymentMethod
  reference?: string | null
  payment_date?: string
  note?: string | null
}

export interface PurchasePaymentPayload {
  payment_account_id?: string
  amount?: number
  payment_currency?: 'USD' | 'KHR'
  payment_amount?: number
  exchange_rate_id?: string | null
  method?: PurchasePaymentMethod
  reference?: string | null
  payment_date: string
  note?: string | null
  payments?: PurchasePaymentLinePayload[]
}

export interface PurchasePaymentCorrectionPayload extends PurchasePaymentLinePayload {
  payment_date: string
  reason: string
}

export interface PurchasePaymentDeletePayload {
  reason: string
}

export interface PurchasePaymentResult {
  purchase: Purchase
  payment: PurchasePayment
  payments?: PurchasePayment[]
  journal: unknown
  journals?: unknown[]
}

export interface PurchasePaymentCorrectionResult {
  purchase: Purchase
  payment: PurchasePayment
  reversed_payment: PurchasePayment
  journal: unknown
  reversal_journal: unknown
}

export interface PurchasePaymentDeleteResult {
  purchase: Purchase
  reversed_payment: PurchasePayment
  reversal_journal: unknown
}

export interface PurchaseReturnItemPayload {
  purchase_item_id: string
  quantity: number
  lot_id?: string | null
  serial_ids?: string[]
}

export interface PurchaseReturnPayload {
  return_date: string
  notes?: string | null
  items: PurchaseReturnItemPayload[]
}

export interface PurchaseReturnItem {
  id: string
  purchase_return_id: string
  purchase_item_id: string
  product_id: string
  variation_id: string | null
  quantity: string | null
  unit_cost: string | null
  total_amount: string | null
  serial_ids: string[] | null
  lot_id: string | null
  product?: {
    id: string
    name: string
  } | null
  variation?: {
    id: string
    name: string
  } | null
  lot?: {
    id: string
    lot_number: string
  } | null
}

export interface PurchaseReturn {
  id: string
  business_id: string
  purchase_id: string
  branch_id: string
  warehouse_id: string
  return_number: string
  status: 'completed' | string
  return_date: string | null
  total_amount: string | null
  notes: string | null
  purchase?: {
    id: string
    purchase_number: string
    status: PurchaseStatus
  } | null
  branch?: {
    id: string
    name: string
  } | null
  warehouse?: {
    id: string
    name: string
  } | null
  creator?: {
    id: string
    name: string
  } | null
  items_count: number
  items?: PurchaseReturnItem[]
  created_at: string
  updated_at: string
}

export interface PurchaseReturnFilters {
  search?: string
  purchase_id?: string
  branch_id?: string
  warehouse_id?: string
  date_from?: string | null
  date_to?: string | null
  page?: number
  per_page?: number
}

export interface PurchaseReceiveItem {
  id: string
  purchase_receive_id: string
  purchase_item_id: string
  quantity: number
  lot_number: string | null
  manufacture_date: string | null
  expiry_date: string | null
  warranty_expires: string | null
  serial_numbers: string[] | null
  notes: string | null
}

export interface PurchaseReceive {
  id: string
  purchase_id: string
  receive_number: string
  received_at: string | null
  notes: string | null
  created_by: string | null
  creator?: { id: string; name: string } | null
  items?: PurchaseReceiveItem[]
  items_count?: number
  created_at: string
  updated_at: string
}

export interface UpdatePurchaseReceiveItemPayload {
  id: string
  quantity: number
  notes?: string | null
}

export interface UpdatePurchaseReceivePayload {
  received_at?: string | null
  notes?: string | null
  items: UpdatePurchaseReceiveItemPayload[]
}
