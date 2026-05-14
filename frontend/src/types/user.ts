export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface UserListItem {
  id: string
  business_id: string
  default_branch_id: string | null
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  status: UserStatus
  roles: string[]
  branch_ids: string[]
  created_at: string
  updated_at: string
}

export interface UserFilters {
  search?: string
  status?: UserStatus | ''
  role?: string
  page?: number
  per_page?: number
}
