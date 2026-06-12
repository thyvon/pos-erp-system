export interface AllowedBranch {
  id: string
  name: string
}

export interface BusinessAddress {
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

export interface User {
  id: string
  business_id?: string
  default_branch_id?: string | null
  first_name: string
  last_name: string
  full_name?: string
  email: string
  phone: string | null
  avatar_url: string | null
  status: 'active' | 'inactive' | 'suspended'
  max_discount: number
  commission_percentage: number
  sales_target_amount?: number | null
  last_login_at?: string | null
  preferences?: Record<string, unknown> | null
  locale?: 'en' | 'km' | string
  business?: Business | null
  roles: string[]
  direct_permissions?: string[]
  permissions: string[]
  enabled_modules?: string[]
  allowed_branches: AllowedBranch[]
  branches?: Array<AllowedBranch & { code?: string; is_default?: boolean; is_active?: boolean }>
  branch_ids?: string[]
  warehouses?: Array<AllowedBranch & { code?: string; is_default?: boolean; is_active?: boolean }>
  warehouse_ids?: string[]
  default_branch?: (AllowedBranch & { code?: string }) | null
  default_warehouse_id?: string | null
  default_warehouse?: (AllowedBranch & { code?: string }) | null
  created_at: string
  updated_at?: string
}

export interface Business {
  id: string
  name: string
  legal_name: string | null
  email?: string | null
  phone?: string | null
  tax_id?: string | null
  country?: string | null
  status?: string
  currency: string
  timezone: string
  locale: string
  date_format?: string
  logo_url?: string | null
  address?: BusinessAddress | null
}

export interface AuthMeResponse {
  user: User
  business: Business
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthLoginResponse {
  token: string
  user: User
}
