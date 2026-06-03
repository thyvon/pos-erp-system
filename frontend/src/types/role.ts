export interface RolePermissionGroup {
  group: string
  permissions: string[]
}

export interface RoleListItem {
  id: number
  name: string
  permissions: string[]
  permissions_count: number
  users_count: number
  is_protected: boolean
  created_at: string
  updated_at: string
}

export interface RolePayload {
  name: string
  permissions: string[]
}

export interface RoleOptions {
  permissions: RolePermissionGroup[]
}

export interface RoleFilters {
  search?: string
  page?: number
  per_page?: number
}
