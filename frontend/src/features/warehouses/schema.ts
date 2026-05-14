import { z } from 'zod'

const nullableText = (max: number) =>
  z.union([z.string().max(max), z.literal('')]).transform((value) => value || null)

export const warehouseSchema = z.object({
  branch_id: z.union([z.string(), z.literal('')]).transform((value) => value || null),
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  code: nullableText(50),
  type: z.enum(['main', 'transit', 'returns', 'damaged']),
  is_default: z.boolean(),
  is_active: z.boolean(),
  allow_negative_stock: z.boolean(),
})

export type WarehouseFormInput = z.input<typeof warehouseSchema>
export type WarehouseFormValues = z.output<typeof warehouseSchema>
