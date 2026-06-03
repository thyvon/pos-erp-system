export interface BusinessProfileAddress {
  line1?: string | null
  line2?: string | null
  village?: string | null
  commune?: string | null
  district?: string | null
  province_city?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
}

export interface BusinessProfileFinancialYear {
  start_month?: number | null
  start_day?: number | null
}

export interface BusinessProfileUsage {
  users_count: number
  branches_count: number
  warehouses_count: number
  remaining_users: number
  remaining_branches: number
}

export interface BusinessProfile {
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
  tier: string
  status: string
  max_users: number
  max_branches: number
  address: BusinessProfileAddress | null
  financial_year: BusinessProfileFinancialYear | null
  usage: BusinessProfileUsage
  created_at: string
  updated_at: string
}

export interface BusinessProfilePayload {
  name: string
  legal_name?: string | null
  tax_id?: string | null
  email: string
  phone?: string | null
  country?: string | null
  logo_url?: string | null
  address?: BusinessProfileAddress | null
}
