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
  quantity: string
  received_quantity: string
  unit_cost: string
  discount_amount: string
  tax_rate: string
  tax_amount: string
  total_amount: string
  notes: string | null
  product?: Pick<Product, 'id' | 'name' | 'sku' | 'type' | 'stock_tracking'> | null
  variation?: Pick<ProductVariation, 'id' | 'name' | 'sku'> | null
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
  discount_amount: string
  tax_amount: string
  shipping_charges: string
  total_amount: string
  paid_amount: string
  notes: string | null
  staff_note: string | null
  branch?: Pick<Branch, 'id' | 'name' | 'code'> | null
  warehouse?: Pick<Warehouse, 'id' | 'name' | 'code' | 'branch_id'> | null
  supplier?: Pick<Supplier, 'id' | 'name' | 'code' | 'company' | 'phone'> | null
  creator?: PurchaseUser | null
  receiver?: PurchaseUser | null
  items: PurchaseItem[]
  created_at: string
  updated_at: string
}

export interface PurchaseItemPayload {
  product_id: string
  variation_id?: string | null
  quantity: number
  unit_cost: number
  discount_amount?: number | null
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
  discount_amount?: number | null
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
