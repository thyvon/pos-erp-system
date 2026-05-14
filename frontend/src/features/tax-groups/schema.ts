import { z } from 'zod'

export const taxGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name is too long'),
  description: z.union([z.string().max(500, 'Description is too long'), z.literal('')])
    .transform((value) => value || null),
  is_active: z.boolean(),
  tax_rate_ids: z.array(z.string().uuid()).min(1, 'Select at least one tax rate'),
})

export type TaxGroupFormInput = z.input<typeof taxGroupSchema>
export type TaxGroupFormValues = z.output<typeof taxGroupSchema>
