export type CustomerType = 'individual' | 'company'
export type CustomerStatus = 'active' | 'inactive'

export interface CustomerGroupSummary {
  id: string
  name: string
}

export interface Customer {
  id: string
  business_id: string
  customer_group_id: string | null
  customer_group: CustomerGroupSummary | null
  code: string
  name: string
  contact_person: string | null
  type: CustomerType
  email: string | null
  phone: string | null
  mobile: string | null
  tax_id: string | null
  date_of_birth: string | null
  address: Record<string, unknown> | null
  credit_limit: number
  pay_term: number
  opening_balance: number
  status: CustomerStatus
  notes: string | null
  custom_fields: Record<string, unknown>
  documents: string[]
  balance: number
  reward_points_balance: number
  created_at: string
  updated_at: string
}

export interface CustomerPayload {
  customer_group_id?: string | null
  name: string
  contact_person?: string | null
  type: CustomerType
  email?: string | null
  phone?: string | null
  mobile?: string | null
  tax_id?: string | null
  date_of_birth?: string | null
  address?: Record<string, unknown> | null
  credit_limit?: number | null
  pay_term?: number | null
  opening_balance?: number | null
  status?: CustomerStatus
  notes?: string | null
  custom_fields?: Record<string, unknown>
  documents?: string[]
}

export interface CustomerFilters {
  search?: string
  status?: CustomerStatus | ''
  page?: number
  per_page?: number
}
