export type BranchType = 'retail' | 'warehouse' | 'office' | 'online'

export interface BranchManager {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface BranchAddress {
  line1?: string | null
  city?: string | null
}

export interface Branch {
  id: string
  business_id: string
  name: string
  code: string
  type: BranchType
  phone: string | null
  email: string | null
  address: BranchAddress | null
  is_default: boolean
  is_active: boolean
  business_hours: Record<string, unknown> | null
  invoice_settings: Record<string, unknown> | null
  manager: BranchManager | null
  created_at: string
  updated_at: string
}

export interface BranchPayload {
  name: string
  code?: string | null
  type?: BranchType | null
  phone?: string | null
  email?: string | null
  manager_id?: string | null
  address?: BranchAddress | null
  is_default?: boolean
  is_active?: boolean
  business_hours?: Record<string, unknown> | null
  invoice_settings?: Record<string, unknown> | null
}

export interface BranchFilters {
  search?: string
  is_active?: boolean | ''
  page?: number
  per_page?: number
}
