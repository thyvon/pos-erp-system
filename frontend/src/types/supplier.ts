export type SupplierStatus = 'active' | 'inactive'

export interface Supplier {
  id: string
  business_id: string
  code: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  tax_id: string | null
  address: Record<string, unknown> | null
  pay_term: number
  opening_balance: number
  status: SupplierStatus
  notes: string | null
  custom_fields: Record<string, unknown>
  documents: string[]
  balance: number
  created_at: string
  updated_at: string
}

export interface SupplierPayload {
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  tax_id?: string | null
  address?: Record<string, unknown> | null
  pay_term?: number | null
  opening_balance?: number | null
  status?: SupplierStatus
  notes?: string | null
  custom_fields?: Record<string, unknown>
  documents?: string[]
}

export interface SupplierFilters {
  search?: string
  status?: SupplierStatus | ''
  page?: number
  per_page?: number
}
