import type { Brand } from './brand'
import type { Category } from './category'
import type { PriceGroup } from './priceGroup'
import type { RackLocation } from './rackLocation'
import type { TaxRate } from './taxRate'
import type { Unit } from './unit'
import type { VariationTemplate } from './variationTemplate'

export type ProductType = 'single' | 'variable' | 'service' | 'combo'
export type StockTracking = 'none' | 'lot' | 'serial'
export type BarcodeType = 'C128' | 'EAN13' | 'QR'
export type TaxType = 'inclusive' | 'exclusive'

export interface ProductSummary {
  id: string
  name: string
  sku: string | null
  type: ProductType
}

export interface ProductVariation {
  id?: string | null
  product_id?: string
  name: string
  sku?: string | null
  variation_value_ids?: string[]
  sub_unit_id?: string | null
  selling_price: string | number | null
  purchase_price: string | number | null
  sub_unit_selling_price?: string | number | null
  sub_unit_purchase_price?: string | number | null
  minimum_selling_price?: string | number | null
  profit_margin?: string | number | null
  is_active?: boolean
  image_url?: string | null
  image_file?: File | null
}

export interface ComboItem {
  id?: string | null
  child_product_id: string
  child_variation_id?: string | null
  quantity: string | number | null
  child_product?: ProductSummary | null
  child_variation?: ProductVariation | null
}

export interface Product {
  id: string
  business_id?: string
  category_id: string | null
  brand_id: string | null
  unit_id: string | null
  sub_unit_id: string | null
  tax_rate_id: string | null
  rack_location_id: string | null
  variation_template_id: string | null
  variation_template_ids?: string[]
  price_group_id: string | null
  name: string
  description: string | null
  sku: string | null
  barcode_type: BarcodeType
  type: ProductType
  stock_tracking: StockTracking
  has_expiry: boolean
  selling_price: string | null
  purchase_price: string | null
  sub_unit_selling_price: string | null
  sub_unit_purchase_price: string | null
  minimum_selling_price: string | null
  profit_margin: string | null
  tax_type: TaxType
  track_inventory: boolean
  alert_quantity: string | null
  max_stock_level: string | null
  is_for_selling: boolean
  is_active: boolean
  weight: string | null
  image_url: string | null
  custom_fields?: Record<string, unknown> | unknown[] | null
  variations_count: number
  combo_items_count: number
  variations?: ProductVariation[]
  combo_items?: ComboItem[]
  category?: Pick<Category, 'id' | 'name'> | null
  brand?: Pick<Brand, 'id' | 'name'> | null
  unit?: Pick<Unit, 'id' | 'name' | 'short_name'> | null
  sub_unit?: Pick<Unit, 'id' | 'name' | 'short_name'> & { conversion_factor?: string | null } | null
  tax_rate?: Pick<TaxRate, 'id' | 'name' | 'rate' | 'type'> | null
  rack_location?: Pick<RackLocation, 'id' | 'name' | 'code'> & {
    warehouse?: { id: string; name: string } | null
  } | null
  price_group?: Pick<PriceGroup, 'id' | 'name' | 'is_default'> | null
}

export interface ProductPayload {
  category_id?: string | null
  brand_id?: string | null
  unit_id?: string | null
  sub_unit_id?: string | null
  tax_rate_id?: string | null
  rack_location_id?: string | null
  price_group_id?: string | null
  variation_template_id?: string | null
  variation_template_ids?: string[]
  name: string
  description?: string | null
  sku?: string | null
  barcode_type: BarcodeType
  type: ProductType
  stock_tracking: StockTracking
  has_expiry?: boolean
  selling_price?: number | null
  purchase_price?: number | null
  sub_unit_selling_price?: number | null
  sub_unit_purchase_price?: number | null
  minimum_selling_price?: number | null
  profit_margin?: number | null
  tax_type: TaxType
  track_inventory?: boolean
  alert_quantity?: number | null
  max_stock_level?: number | null
  is_for_selling?: boolean
  is_active?: boolean
  weight?: number | null
  image_file?: File | null
  custom_fields?: Record<string, unknown> | null
  variations?: ProductVariation[]
  combo_items?: ComboItem[]
}

export interface CustomFieldDefinition {
  id: string
  business_id: string
  module: string
  field_name: string
  field_label: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'checkbox'
  options: string[] | null
  is_required: boolean
  sort_order: number
}

export interface ProductMatrixVariation extends ProductVariation {
  combination_key?: string
}

export interface ProductFilters {
  search?: string
  type?: ProductType | ''
  stock_tracking?: StockTracking | ''
  is_active?: boolean | ''
  category_id?: string
  brand_id?: string
  warehouse_id?: string
  page?: number
  per_page?: number
}

export interface ProductFormOptions {
  categories: Category[]
  brands: Brand[]
  units: Unit[]
  tax_rates: TaxRate[]
  price_groups: PriceGroup[]
  variation_templates: VariationTemplate[]
  rack_locations_enabled: boolean
  rack_locations: RackLocation[]
  custom_fields: CustomFieldDefinition[]
  combo_products: Product[]
}
