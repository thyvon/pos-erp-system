export interface InventoryWarehouseOption {
  id: string
  name: string
  code: string | null
  branch_id: string | null
  branch_name: string | null
}

export interface InventoryProductOption {
  id: string
  name: string
  sku: string | null
  type: string
}

export interface InventoryOptions {
  products: InventoryProductOption[]
  warehouses: InventoryWarehouseOption[]
  transfer_from_warehouses: InventoryWarehouseOption[]
  transfer_to_warehouses: InventoryWarehouseOption[]
}

export interface InventoryLookupUnit {
  id: string
  name: string
  short_name: string | null
}

export interface InventoryLookupSubUnit extends InventoryLookupUnit {
  conversion_factor: string | null
}

export interface InventoryProductLookupItem {
  lookup_key: string
  product_id: string
  variation_id: string | null
  lot_id: string | null
  serial_id: string | null
  product_name: string | null
  variation_name: string | null
  label: string
  sku: string | null
  lot_number?: string | null
  expiry_date?: string | null
  serial_number?: string | null
  unit_cost: string | null
  selling_price?: string | null
  sub_unit_selling_price?: string | null
  minimum_selling_price?: string | null
  stock_tracking: 'none' | 'lot' | 'serial' | string | null
  unit: InventoryLookupUnit | null
  sub_unit: InventoryLookupSubUnit | null
  ending_quantity: string | null
  on_hand_quantity: string | null
  reserved_quantity: string | null
  available_quantity: string | null
  match_type: string
  match_value: string
  is_exact_match: boolean
}

export interface StockAdjustmentWarehouse {
  id: string
  name: string
  branch_id: string | null
  branch_name: string | null
}

export interface StockAdjustmentCreator {
  id: string
  name: string
}

export interface StockAdjustmentItemProduct {
  id: string
  name: string
  sku: string | null
}

export interface StockAdjustmentItemVariation {
  id: string
  name: string
  sku: string | null
}

export interface StockAdjustmentItemLot {
  id: string
  lot_number: string
}

export interface StockAdjustmentItemSerial {
  id: string
  serial_number: string
}

export interface StockAdjustmentItem {
  id: string
  product_id: string
  variation_id: string | null
  lot_id: string | null
  serial_id: string | null
  direction: 'in' | 'out'
  quantity: string | number
  unit_cost: string | number | null
  notes: string | null
  product: StockAdjustmentItemProduct | null
  variation: StockAdjustmentItemVariation | null
  lot: StockAdjustmentItemLot | null
  serial: StockAdjustmentItemSerial | null
}

export interface StockAdjustment {
  id: string
  business_id: string
  warehouse_id: string
  reference_no: string
  date: string
  reason: string | null
  notes: string | null
  warehouse: StockAdjustmentWarehouse | null
  creator: StockAdjustmentCreator | null
  items: StockAdjustmentItem[]
  created_at: string
  updated_at: string
}

export interface StockAdjustmentFilters {
  search?: string
  warehouse_id?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface StockAdjustmentItemPayload {
  product_id: string
  variation_id?: string | null
  lot_id?: string | null
  serial_id?: string | null
  direction: 'in' | 'out'
  quantity: number
  unit_cost?: number | null
  notes?: string | null
}

export interface StockAdjustmentPayload {
  warehouse_id: string
  date: string
  reason?: string | null
  notes?: string | null
  items: StockAdjustmentItemPayload[]
}

export type StockTransferStatus = 'pending' | 'in_transit' | 'received'

export interface StockTransferWarehouse {
  id: string
  name: string
  branch_id: string | null
  branch_name: string | null
}

export interface StockTransferUser {
  id: string
  name: string
}

export interface StockTransferItemProduct {
  id: string
  name: string
  sku: string | null
}

export interface StockTransferItemVariation {
  id: string
  name: string
  sku: string | null
}

export interface StockTransferItemLot {
  id: string
  lot_number: string
}

export interface StockTransferItemSerial {
  id: string
  serial_number: string
}

export interface StockTransferItem {
  id: string
  product_id: string
  variation_id: string | null
  lot_id: string | null
  serial_id: string | null
  quantity: string | number
  unit_cost: string | number | null
  notes: string | null
  product: StockTransferItemProduct | null
  variation: StockTransferItemVariation | null
  lot: StockTransferItemLot | null
  serial: StockTransferItemSerial | null
}

export interface StockTransfer {
  id: string
  business_id: string
  from_warehouse_id: string
  to_warehouse_id: string
  reference_no: string
  status: StockTransferStatus
  date: string
  notes: string | null
  from_warehouse: StockTransferWarehouse | null
  to_warehouse: StockTransferWarehouse | null
  creator: StockTransferUser | null
  sender: StockTransferUser | null
  receiver: StockTransferUser | null
  sent_at: string | null
  received_at: string | null
  items: StockTransferItem[]
  created_at: string
  updated_at: string
}

export interface StockTransferFilters {
  search?: string
  warehouse_id?: string
  direction?: 'in' | 'out'
  status?: StockTransferStatus
  from_warehouse_id?: string
  to_warehouse_id?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface StockTransferItemPayload {
  product_id: string
  variation_id?: string | null
  lot_id?: string | null
  serial_id?: string | null
  quantity: number
  unit_cost?: number | null
  notes?: string | null
}

export interface StockTransferPayload {
  from_warehouse_id: string
  to_warehouse_id: string
  date: string
  notes?: string | null
  send?: boolean
  items: StockTransferItemPayload[]
}

export type StockCountStatus = 'in_progress' | 'completed'

export interface StockCountWarehouse {
  id: string
  name: string
  branch_id: string | null
  branch_name: string | null
}

export interface StockCountUser {
  id: string
  name: string
}

export interface StockCountItemProduct {
  id: string
  name: string
  sku: string | null
}

export interface StockCountItemVariation {
  id: string
  name: string
  sku: string | null
}

export interface StockCountItemLot {
  id: string
  lot_number: string
}

export interface StockCountItem {
  id: string
  product_id: string
  variation_id: string | null
  system_quantity: string | number
  ending_balance?: string | number
  counted_quantity: string | number | null
  difference: string | number | null
  unit_cost: string | number | null
  product: StockCountItemProduct | null
  variation: StockCountItemVariation | null
  lot: StockCountItemLot | null
}

export interface StockCountEntry {
  id: string
  business_id: string
  stock_count_id: string
  stock_count_item_id: string
  product_id: string
  variation_id: string | null
  quantity: string | number
  unit_cost: string | number | null
  product: StockCountItemProduct | null
  variation: StockCountItemVariation | null
  lot: StockCountItemLot | null
  creator: StockCountUser | null
  created_at: string
}

export interface StockCount {
  id: string
  business_id: string
  warehouse_id: string
  reference_no: string
  status: StockCountStatus
  date: string
  notes: string | null
  discrepancy_count: number
  warehouse: StockCountWarehouse | null
  creator: StockCountUser | null
  completer: StockCountUser | null
  items?: StockCountItem[]
  created_at: string
  updated_at: string
}

export interface StockCountFilters {
  search?: string
  warehouse_id?: string
  status?: StockCountStatus
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface StockCountItemFilters {
  search?: string
  page?: number
  per_page?: number
}

export interface StockCountEntryFilters {
  search?: string
  page?: number
  per_page?: number
}

export interface StockCountSeedItemPayload {
  product_id: string
  variation_id?: string | null
  lot_id?: string | null
  unit_cost?: number | null
}

export interface StockCountPayload {
  warehouse_id: string
  date: string
  notes?: string | null
  items?: StockCountSeedItemPayload[]
}

export interface StockCountEntryPayload {
  product_id: string
  variation_id?: string | null
  lot_id?: string | null
  quantity: number
  unit_cost?: number | null
}

export interface StockCountEntryUpdatePayload {
  quantity: number
}

export interface StockCountItemUpdatePayload {
  counted_quantity: number
}

export interface StockCountCompletePayload {
  items?: Array<{
    id: string
    counted_quantity?: number | null
  }>
}

export type StockLotStatus = 'active' | 'depleted' | 'expired' | 'recalled' | 'quarantine'

export type StockSerialStatus = 'in_stock' | 'sold' | 'returned' | 'transferred' | 'written_off' | 'reserved'

export interface StockLevel {
  id: string
  business_id: string
  product_id: string
  variation_id: string | null
  warehouse_id: string
  quantity: string | number
  reserved_quantity: string | number
  available_qty: string | number
  product: StockTrackedProduct | null
  variation: StockTrackedVariation | null
  warehouse: StockTrackedWarehouse | null
  updated_at: string | null
}

export interface StockLevelFilters {
  search?: string
  warehouse_id?: string
  product_id?: string
  variation_id?: string
  page?: number
  per_page?: number
}

export interface StockTrackedProduct {
  id: string
  name: string
  sku: string | null
}

export interface StockTrackedVariation {
  id: string
  name: string
  sku: string | null
}

export interface StockTrackedWarehouse {
  id: string
  name: string
  branch_id: string | null
  branch_name: string | null
}

export interface StockTrackedSupplier {
  id: string
  name: string
}

export interface StockLot {
  id: string
  business_id: string
  product_id: string
  variation_id: string | null
  warehouse_id: string
  supplier_id: string | null
  lot_number: string
  manufacture_date: string | null
  expiry_date: string | null
  received_at: string | null
  unit_cost: string | number | null
  qty_received: string | number
  qty_on_hand: string | number
  qty_reserved: string | number
  qty_available: string | number
  status: StockLotStatus
  notes: string | null
  product: StockTrackedProduct | null
  variation: StockTrackedVariation | null
  warehouse: StockTrackedWarehouse | null
  supplier: StockTrackedSupplier | null
  created_at: string
  updated_at: string
}

export interface StockLotFilters {
  search?: string
  warehouse_id?: string
  product_id?: string
  variation_id?: string
  status?: StockLotStatus
  page?: number
  per_page?: number
}

export interface StockLotStatusPayload {
  status: StockLotStatus
  reason?: string | null
}

export interface StockSerial {
  id: string
  business_id: string
  product_id: string
  variation_id: string | null
  warehouse_id: string | null
  supplier_id: string | null
  serial_number: string
  status: StockSerialStatus
  purchase_item_id: string | null
  sale_item_id: string | null
  unit_cost: string | number | null
  warranty_expires: string | null
  received_at: string | null
  sold_at: string | null
  notes: string | null
  product: StockTrackedProduct | null
  variation: StockTrackedVariation | null
  warehouse: StockTrackedWarehouse | null
  supplier: StockTrackedSupplier | null
  created_at: string
  updated_at: string
}

export interface StockSerialFilters {
  search?: string
  warehouse_id?: string
  product_id?: string
  variation_id?: string
  status?: StockSerialStatus
  page?: number
  per_page?: number
}

export interface StockSerialWriteOffPayload {
  reason: string
}
