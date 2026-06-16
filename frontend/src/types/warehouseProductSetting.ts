import type { Product, ProductVariation } from './product'
import type { RackLocation } from './rackLocation'
import type { Supplier } from './supplier'

export interface WarehouseProductSettingWarehouse {
  id: string
  name: string
  code: string | null
  branch: {
    id: string
    name: string
  } | null
}

export interface WarehouseProductSetting {
  id: string
  business_id: string
  warehouse_id: string
  product_id: string
  variation_id: string | null
  rack_location_id: string | null
  preferred_supplier_id: string | null
  min_stock_alert: string | null
  max_stock_level: string | null
  reorder_point: string | null
  reorder_quantity: string | null
  is_active: boolean
  notes: string | null
  warehouse: WarehouseProductSettingWarehouse | null
  product: Pick<Product, 'id' | 'name' | 'sku' | 'type' | 'stock_tracking' | 'track_inventory'> | null
  variation: Pick<ProductVariation, 'id' | 'name' | 'sku'> | null
  rack_location: Pick<RackLocation, 'id' | 'name' | 'code'> | null
  preferred_supplier: Pick<Supplier, 'id' | 'name' | 'phone'> | null
  created_at: string
  updated_at: string
}

export interface WarehouseProductSettingPayload {
  warehouse_id: string
  product_id: string
  variation_id?: string | null
  rack_location_id?: string | null
  preferred_supplier_id?: string | null
  min_stock_alert?: number | null
  max_stock_level?: number | null
  reorder_point?: number | null
  reorder_quantity?: number | null
  is_active?: boolean
  notes?: string | null
}

export interface WarehouseProductSettingFilters {
  search?: string
  warehouse_id?: string
  product_id?: string
  variation_id?: string
  rack_location_id?: string
  preferred_supplier_id?: string
  is_active?: boolean | ''
  page?: number
  per_page?: number
}
