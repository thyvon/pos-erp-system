export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface UserBranch {
  id: string
  name: string
  code: string | null
  is_default: boolean
  is_active: boolean
}

export interface UserDefaultBranch {
  id: string
  name: string
  code: string | null
}

export interface UserWarehouse {
  id: string
  name: string
  code: string | null
  is_default: boolean
  is_active: boolean
}

export interface UserListItem {
  id: string
  business_id: string
  default_branch_id: string | null
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  avatar_url?: string | null
  status: UserStatus
  max_discount: string | number | null
  commission_percentage: string | number | null
  sales_target_amount: string | number | null
  roles: string[]
  direct_permissions: string[]
  branches: UserBranch[]
  branch_ids: string[]
  warehouses?: UserWarehouse[]
  warehouse_ids: string[]
  default_branch: UserDefaultBranch | null
  preferences?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface UserPayload {
  first_name: string
  last_name: string
  email: string
  password?: string | null
  phone?: string | null
  avatar_url?: string | null
  status?: UserStatus
  max_discount?: number | null
  commission_percentage?: number | null
  sales_target_amount?: number | null
  preferences?: Record<string, unknown> | null
  role?: string | null
  roles?: string[]
  direct_permissions?: string[]
  branch_ids?: string[]
  warehouse_ids?: string[]
  default_branch_id?: string | null
}

export interface UserRoleOption {
  name: string
  permissions: string[]
}

export interface UserPermissionGroup {
  group: string
  permissions: string[]
}

export interface UserAccessOptions {
  roles: UserRoleOption[]
  permissions: UserPermissionGroup[]
  branches: UserBranch[]
  warehouses: UserBranch[]
}

export interface ImportResult {
  imported: number
  skipped: number
  errors?: string[]
}

export interface UserFilters {
  search?: string
  status?: UserStatus | ''
  role?: string | ''
  page?: number
  per_page?: number
}
