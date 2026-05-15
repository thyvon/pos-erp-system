export interface RackLocationWarehouseBranch {
  id: string
  name: string
}

export interface RackLocationWarehouse {
  id: string
  name: string
  code: string | null
  branch: RackLocationWarehouseBranch | null
}

export interface RackLocation {
  id: string
  business_id: string
  warehouse_id: string
  name: string
  code: string
  description: string | null
  warehouse: RackLocationWarehouse | null
  created_at: string
  updated_at: string
}

export interface RackLocationPayload {
  warehouse_id: string
  name: string
  code: string
  description?: string | null
}

export interface RackLocationFilters {
  search?: string
  warehouse_id?: string
  page?: number
  per_page?: number
}
