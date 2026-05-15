import { z } from 'zod'

export const variationValueSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().min(1, 'Name is required').max(150, 'Name is too long'),
  sort_order: z.coerce
    .number()
    .int('Sort order must be a whole number')
    .min(0, 'Sort order cannot be negative')
    .max(65535, 'Sort order is too large'),
})

export const variationTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name is too long'),
  values: z.array(variationValueSchema).min(1, 'Add at least one value'),
})

export type VariationTemplateFormInput = z.input<typeof variationTemplateSchema>
export type VariationTemplateFormValues = z.output<typeof variationTemplateSchema>
