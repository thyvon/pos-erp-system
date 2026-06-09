import { z } from 'zod'

const nullableText = () =>
  z.string().trim().transform((value) => value || null)

export const stockAdjustmentItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  variation_id: z.string().nullable().optional(),
  lot_id: z.string().nullable().optional(),
  serial_id: z.string().nullable().optional(),
  product_label: z.string().optional(),
  sku: z.string().nullable().optional(),
  lot_number: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  available_quantity: z.string().nullable().optional(),
  direction: z.enum(['in', 'out']),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  unit_cost: z.coerce.number().min(0, 'Unit cost cannot be negative').nullable().optional(),
  notes: nullableText().optional(),
})

export const stockAdjustmentSchema = z.object({
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  date: z.string().min(1, 'Date is required'),
  reason: nullableText().optional(),
  notes: nullableText().optional(),
  items: z.array(stockAdjustmentItemSchema).min(1, 'Add at least one item'),
})

export type StockAdjustmentFormInput = z.input<typeof stockAdjustmentSchema>
export type StockAdjustmentFormValues = z.output<typeof stockAdjustmentSchema>

export const stockOpeningBalanceItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  variation_id: z.string().nullable().optional(),
  product_label: z.string().optional(),
  sku: z.string().nullable().optional(),
  stock_tracking: z.string().nullable().optional(),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  unit_cost: z.coerce.number().min(0, 'Unit cost cannot be negative').nullable().optional(),
  lot_number: nullableText().optional(),
  manufacture_date: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  serial_number: nullableText().optional(),
  warranty_expires: z.string().nullable().optional(),
  notes: nullableText().optional(),
}).superRefine((value, context) => {
  if (value.stock_tracking === 'lot' && !value.lot_number) {
    context.addIssue({ code: 'custom', path: ['lot_number'], message: 'Lot number is required' })
  }

  if (value.stock_tracking === 'serial') {
    if (!value.serial_number) {
      context.addIssue({ code: 'custom', path: ['serial_number'], message: 'Serial number is required' })
    }

    if (value.quantity !== 1) {
      context.addIssue({ code: 'custom', path: ['quantity'], message: 'Serial quantity must be one' })
    }
  }
})

export const stockOpeningBalanceSchema = z.object({
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  date: z.string().min(1, 'Date is required'),
  notes: nullableText().optional(),
  items: z.array(stockOpeningBalanceItemSchema).min(1, 'Add at least one item'),
})

export type StockOpeningBalanceFormInput = z.input<typeof stockOpeningBalanceSchema>
export type StockOpeningBalanceFormValues = z.output<typeof stockOpeningBalanceSchema>

export const stockTransferItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  variation_id: z.string().nullable().optional(),
  lot_id: z.string().nullable().optional(),
  serial_id: z.string().nullable().optional(),
  product_label: z.string().optional(),
  sku: z.string().nullable().optional(),
  lot_number: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  available_quantity: z.string().nullable().optional(),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  unit_cost: z.coerce.number().min(0, 'Unit cost cannot be negative').nullable().optional(),
  notes: nullableText().optional(),
})

export const stockTransferSchema = z.object({
  from_warehouse_id: z.string().min(1, 'Source warehouse is required'),
  to_warehouse_id: z.string().min(1, 'Destination warehouse is required'),
  date: z.string().min(1, 'Date is required'),
  notes: nullableText().optional(),
  send: z.boolean().optional(),
  items: z.array(stockTransferItemSchema).min(1, 'Add at least one item'),
}).refine((values) => values.from_warehouse_id !== values.to_warehouse_id, {
  path: ['to_warehouse_id'],
  message: 'Destination warehouse must be different from source warehouse',
})

export type StockTransferFormInput = z.input<typeof stockTransferSchema>
export type StockTransferFormValues = z.output<typeof stockTransferSchema>

export const stockCountSeedItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  variation_id: z.string().nullable().optional(),
  lot_id: z.string().nullable().optional(),
  product_label: z.string().optional(),
  sku: z.string().nullable().optional(),
  lot_number: z.string().nullable().optional(),
  available_quantity: z.string().nullable().optional(),
  counted_quantity: z.coerce.number().min(0, 'Counted quantity cannot be negative').optional(),
  unit_cost: z.coerce.number().min(0, 'Unit cost cannot be negative').nullable().optional(),
})

export const stockCountSchema = z.object({
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  date: z.string().min(1, 'Date is required'),
  notes: nullableText().optional(),
  items: z.array(stockCountSeedItemSchema).optional(),
})

export const stockCountEntrySchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  variation_id: z.string().nullable().optional(),
  lot_id: z.string().nullable().optional(),
  product_label: z.string().optional(),
  sku: z.string().nullable().optional(),
  lot_number: z.string().nullable().optional(),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative'),
  unit_cost: z.coerce.number().min(0, 'Unit cost cannot be negative').nullable().optional(),
})

export const stockCountItemUpdateSchema = z.object({
  counted_quantity: z.coerce.number().min(0, 'Counted quantity cannot be negative'),
})

export type StockCountFormInput = z.input<typeof stockCountSchema>
export type StockCountFormValues = z.output<typeof stockCountSchema>
export type StockCountEntryFormInput = z.input<typeof stockCountEntrySchema>
export type StockCountEntryFormValues = z.output<typeof stockCountEntrySchema>
export type StockCountItemUpdateFormInput = z.input<typeof stockCountItemUpdateSchema>
export type StockCountItemUpdateFormValues = z.output<typeof stockCountItemUpdateSchema>
