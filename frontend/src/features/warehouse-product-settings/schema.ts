import { z } from 'zod'

const nullableText = () =>
  z.string().trim().transform((value) => value || null)

const nullableNumber = () =>
  z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === '') return null
      return Number(value)
    })
    .refine((value) => value === null || Number.isFinite(value), 'Enter a valid number')
    .refine((value) => value === null || value >= 0, 'Value cannot be negative')

export const warehouseProductSettingSchema = z.object({
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  product_id: z.string().min(1, 'Product is required'),
  variation_id: z.string().nullable().optional(),
  rack_location_id: z.string().nullable().optional(),
  preferred_supplier_id: z.string().nullable().optional(),
  min_stock_alert: nullableNumber(),
  max_stock_level: nullableNumber(),
  reorder_point: nullableNumber(),
  reorder_quantity: nullableNumber(),
  is_active: z.boolean(),
  notes: nullableText(),
}).superRefine((value, ctx) => {
  if (value.min_stock_alert !== null && value.max_stock_level !== null && value.max_stock_level < value.min_stock_alert) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['max_stock_level'],
      message: 'Maximum stock must be greater than or equal to minimum stock',
    })
  }

  if (value.reorder_point !== null && value.reorder_quantity === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['reorder_quantity'],
      message: 'Reorder quantity is required when reorder point is set',
    })
  }

  if (value.reorder_point !== null && value.max_stock_level !== null && value.reorder_point > value.max_stock_level) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['reorder_point'],
      message: 'Reorder point cannot be greater than maximum stock',
    })
  }
})

export type WarehouseProductSettingFormInput = z.input<typeof warehouseProductSettingSchema>
export type WarehouseProductSettingFormValues = z.output<typeof warehouseProductSettingSchema>
