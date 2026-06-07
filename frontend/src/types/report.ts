import type { SalePaymentStatus, SaleStatus, SaleType } from './sales'
import type { PurchasePaymentStatus, PurchaseStatus } from './purchase'

export interface SalesReportFilters {
  search?: string
  status?: SaleStatus | ''
  type?: SaleType | ''
  payment_status?: SalePaymentStatus | ''
  branch_id?: string
  warehouse_id?: string
  customer_id?: string
  date_from?: string | null
  date_to?: string | null
  page?: number
  per_page?: number
}

export interface SalesReturnReportFilters {
  search?: string
  status?: string
  refund_method?: string
  sale_id?: string
  branch_id?: string
  warehouse_id?: string
  customer_id?: string
  date_from?: string | null
  date_to?: string | null
  page?: number
  per_page?: number
}

export interface PurchasesReportFilters {
  search?: string
  status?: string
  payment_status?: string
  branch_id?: string
  warehouse_id?: string
  supplier_id?: string
  date_from?: string | null
  date_to?: string | null
  page?: number
  per_page?: number
}

export interface PurchaseReturnsReportFilters {
  search?: string
  status?: string
  purchase_id?: string
  branch_id?: string
  warehouse_id?: string
  supplier_id?: string
  date_from?: string | null
  date_to?: string | null
  page?: number
  per_page?: number
}

export interface SalePaymentsReportFilters {
  search?: string
  status?: 'completed' | 'reversed' | ''
  method?: string
  branch_id?: string
  warehouse_id?: string
  customer_id?: string
  payment_account_id?: string
  cashier_id?: string
  date_from?: string | null
  date_to?: string | null
  page?: number
  per_page?: number
}

export interface PurchasePaymentsReportFilters {
  search?: string
  status?: 'completed' | 'reversed' | ''
  method?: string
  branch_id?: string
  warehouse_id?: string
  supplier_id?: string
  payment_account_id?: string
  cashier_id?: string
  date_from?: string | null
  date_to?: string | null
  page?: number
  per_page?: number
}

export interface ReportRelation {
  id: string
  name: string
  code?: string | null
  phone?: string | null
}

export interface SalesReportSummary {
  count: number
  total_amount: string
  paid_amount: string
  due_amount: string
  tax_amount: string
  discount_amount: string
  shipping_charges: string
}

export interface SalesReportRow {
  id: string
  sale_number: string
  sale_date: string | null
  type: SaleType
  status: SaleStatus
  payment_status: SalePaymentStatus
  branch?: ReportRelation | null
  warehouse?: ReportRelation | null
  customer?: ReportRelation | null
  subtotal: string
  discount_amount: string
  tax_amount: string
  shipping_charges: string
  total_amount: string
  paid_amount: string
  due_amount: string
}

export interface SalesReportResponse {
  summary: SalesReportSummary
  rows: SalesReportRow[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface SalesReturnReportSummary {
  count: number
  total_amount: string
}

export interface SalesReturnReportRow {
  id: string
  return_number: string
  return_date: string | null
  status: string
  refund_method: string | null
  sale?: {
    id: string
    sale_number: string
    status: string
  } | null
  branch?: ReportRelation | null
  warehouse?: ReportRelation | null
  customer?: ReportRelation | null
  items_count: number
  total_amount: string
}

export interface SalesReturnReportResponse {
  summary: SalesReturnReportSummary
  rows: SalesReturnReportRow[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface PurchasesReportSummary {
  count: number
  total_amount: string
  paid_amount: string
  due_amount: string
  tax_amount: string
  discount_amount: string
  shipping_charges: string
}

export interface PurchasesReportRow {
  id: string
  purchase_number: string
  supplier_invoice_no: string | null
  purchase_date: string | null
  expected_date: string | null
  status: PurchaseStatus
  payment_status: PurchasePaymentStatus
  branch?: ReportRelation | null
  warehouse?: ReportRelation | null
  supplier?: (ReportRelation & { company?: string | null }) | null
  subtotal: string
  discount_amount: string
  tax_amount: string
  shipping_charges: string
  total_amount: string
  paid_amount: string
  due_amount: string
}

export interface PurchasesReportResponse {
  summary: PurchasesReportSummary
  rows: PurchasesReportRow[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface PurchaseReturnsReportSummary {
  count: number
  total_amount: string
}

export interface PurchaseReturnsReportRow {
  id: string
  return_number: string
  return_date: string | null
  status: string
  purchase?: {
    id: string
    purchase_number: string
    status: string
  } | null
  branch?: ReportRelation | null
  warehouse?: ReportRelation | null
  supplier?: (ReportRelation & { company?: string | null }) | null
  items_count: number
  total_amount: string
}

export interface PurchaseReturnsReportResponse {
  summary: PurchaseReturnsReportSummary
  rows: PurchaseReturnsReportRow[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface SalePaymentsReportSummary {
  count: number
  total_amount: string
}

export interface SalePaymentsReportRow {
  id: string
  payment_date: string | null
  method: string
  reference: string | null
  status: 'completed' | 'reversed'
  amount: string
  payment_currency: string
  payment_amount: string
  exchange_rate: string | null
  sale?: {
    id: string
    sale_number: string
    status: string
  } | null
  branch?: ReportRelation | null
  customer?: ReportRelation | null
  payment_account?: {
    id: string
    name: string
    type: string
  } | null
  cashier?: {
    id: string
    name: string
  } | null
}

export interface SalePaymentsReportResponse {
  summary: SalePaymentsReportSummary
  rows: SalePaymentsReportRow[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}

export interface PurchasePaymentsReportSummary {
  count: number
  total_amount: string
}

export interface PurchasePaymentsReportRow {
  id: string
  payment_date: string | null
  method: string
  reference: string | null
  status: 'completed' | 'reversed'
  amount: string
  payment_currency: string
  payment_amount: string
  exchange_rate: string | null
  purchase?: {
    id: string
    purchase_number: string
    status: string
  } | null
  branch?: ReportRelation | null
  supplier?: (ReportRelation & { company?: string | null }) | null
  payment_account?: {
    id: string
    name: string
    type: string
  } | null
  cashier?: {
    id: string
    name: string
  } | null
}

export interface PurchasePaymentsReportResponse {
  summary: PurchasePaymentsReportSummary
  rows: PurchasePaymentsReportRow[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}
