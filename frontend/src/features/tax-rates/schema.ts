import { z } from 'zod'

export const taxRateSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(150, 'Name is too long'),
    rate: z.coerce.number().min(0, 'Rate cannot be negative').max(99999999.99, 'Rate is too high'),
    type: z.enum(['percentage', 'fixed']),
    is_default: z.boolean(),
    is_active: z.boolean(),
  })
  .refine((values) => values.type !== 'percentage' || values.rate <= 100, {
    path: ['rate'],
    message: 'Percentage tax rate cannot exceed 100',
  })

export type TaxRateFormInput = z.input<typeof taxRateSchema>
export type TaxRateFormValues = z.output<typeof taxRateSchema>
