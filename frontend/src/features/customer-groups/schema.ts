import { z } from 'zod'

export const customerGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name is too long'),
  discount: z.coerce.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100'),
  price_group_id: z.union([z.string().uuid(), z.literal('')]).transform((value) => value || null),
})

export type CustomerGroupFormInput = z.input<typeof customerGroupSchema>
export type CustomerGroupFormValues = z.output<typeof customerGroupSchema>
