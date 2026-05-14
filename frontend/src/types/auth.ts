export interface AllowedBranch {
  id: string
  name: string
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
  allowed_branches: AllowedBranch[]
  branches?: Array<AllowedBranch & { code?: string; is_default?: boolean; is_active?: boolean }>
  branch_ids?: string[]
  default_branch?: (AllowedBranch & { code?: string }) | null
  created_at: string
  updated_at?: string
}

export interface Business {
  id: string
  name: string
  legal_name: string | null
  email?: string | null
  status?: string
  currency: string
  timezone: string
  locale: string
  logo_url?: string | null
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
