import { z } from 'zod'

export const priceGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name is too long'),
  description: z.string().trim().transform((value) => value || null),
  is_default: z.boolean(),
})

export type PriceGroupFormInput = z.input<typeof priceGroupSchema>
export type PriceGroupFormValues = z.output<typeof priceGroupSchema>
