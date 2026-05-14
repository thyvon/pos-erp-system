import { z } from 'zod'

const sortOrderSchema = z
  .union([z.string(), z.number(), z.literal('')])
  .transform((value) => {
    if (value === '') return 0
    const numberValue = Number(value)
    return Number.isNaN(numberValue) ? 0 : numberValue
  })
  .pipe(z.number().int('Sort order must be a whole number').min(0, 'Sort order cannot be negative').max(999))

export const customFieldSchema = z.object({
  module: z.enum(['product', 'customer', 'supplier']),
  field_name: z
    .string()
    .min(1, 'Field name is required')
    .max(100, 'Field name is too long')
    .regex(/^[a-z][a-z0-9_]*$/, 'Use lowercase letters, numbers, and underscores. Start with a letter.'),
  field_label: z.string().min(1, 'Field label is required').max(150, 'Field label is too long'),
  field_type: z.enum(['text', 'number', 'date', 'select', 'checkbox']),
  options_text: z.string().max(2000, 'Options are too long'),
  is_required: z.boolean(),
  sort_order: sortOrderSchema,
})

export type CustomFieldFormInput = z.input<typeof customFieldSchema>
export type CustomFieldFormValues = z.output<typeof customFieldSchema>
