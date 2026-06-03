export type ManagedBusinessStatus = 'active' | 'suspended' | 'cancelled'
export type ManagedBusinessTier = 'basic' | 'standard' | 'enterprise'

export interface ManagedBusinessAddress {
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
}

export interface ManagedBusinessFinancialYear {
  start_month?: number | null
  start_day?: number | null
}

export interface ManagedBusinessOwner {
  id: string | null
  full_name: string
  email: string | null
  phone: string | null
  status: string | null
}

export interface ManagedBusinessUsage {
  users_count: number
  branches_count: number
  warehouses_count: number
}

export interface ManagedBusiness {
  id: string
  name: string
  legal_name: string | null
  tax_id: string | null
  email: string
  phone: string | null
  currency: string
  timezone: string
  country: string | null
  locale: 'en' | 'km' | string | null
  logo_url: string | null
  tier: ManagedBusinessTier
  status: ManagedBusinessStatus
  max_users: number
  max_branches: number
  address: ManagedBusinessAddress | null
  financial_year: ManagedBusinessFinancialYear | null
  usage: ManagedBusinessUsage
  owner?: ManagedBusinessOwner | null
  created_at: string
  updated_at: string
}

export interface ManagedBusinessPayload {
  name: string
  legal_name?: string | null
  tax_id?: string | null
  email: string
  phone?: string | null
  currency: string
  timezone: string
  country?: string | null
  locale?: 'en' | 'km' | null
  logo_url?: string | null
  tier: ManagedBusinessTier
  status: ManagedBusinessStatus
  max_users: number
  max_branches: number
  address?: ManagedBusinessAddress | null
  financial_year?: ManagedBusinessFinancialYear | null
  owner?: {
    first_name: string
    last_name?: string | null
    email: string
    phone?: string | null
    password: string
  }
}

export interface ManagedBusinessFilters {
  search?: string
  status?: ManagedBusinessStatus | ''
  tier?: ManagedBusinessTier | ''
  page?: number
  per_page?: number
}
