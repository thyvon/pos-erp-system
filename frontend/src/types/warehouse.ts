import type { Branch } from './branch'

export type WarehouseType = 'main' | 'transit' | 'returns' | 'damaged'

export interface WarehouseBranch {
  id: string
  name: string
  code: string | null
}

export interface Warehouse {
  id: string
  business_id: string
  branch_id: string | null
  name: string
  code: string
  type: WarehouseType
  is_active: boolean
  is_default: boolean
  allow_negative_stock: boolean
  branch: WarehouseBranch | null
  created_at: string
  updated_at: string
}

export interface WarehousePayload {
  branch_id?: string | null
  name: string
  code?: string | null
  type?: WarehouseType | null
  is_active?: boolean
  is_default?: boolean
  allow_negative_stock?: boolean
}

export interface WarehouseFilters {
  search?: string
  type?: WarehouseType | ''
  branch_id?: Branch['id'] | ''
  page?: number
  per_page?: number
}
