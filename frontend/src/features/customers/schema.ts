import { z } from 'zod'

const nullableText = (max: number) =>
  z.union([z.string().max(max), z.literal('')]).transform((value) => value || null)

const nullableNumber = z
  .union([z.coerce.number().min(0), z.literal('')])
  .transform((value) => (value === '' ? null : value))

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(191, 'Name is too long'),
  type: z.enum(['individual', 'company']),
  email: z
    .union([z.string().email('Invalid email address').max(191), z.literal('')])
    .transform((value) => value || null),
  phone: nullableText(50),
  mobile: nullableText(50),
  tax_id: nullableText(100),
  credit_limit: nullableNumber,
  pay_term: z
    .union([z.coerce.number().int().min(0).max(3650), z.literal('')])
    .transform((value) => (value === '' ? null : value)),
  opening_balance: nullableNumber,
  status: z.enum(['active', 'inactive']),
  notes: z.union([z.string(), z.literal('')]).transform((value) => value || null),
  custom_fields: z.record(z.string(), z.unknown()).default({}),
})

export type CustomerFormInput = z.input<typeof customerSchema>
export type CustomerFormValues = z.output<typeof customerSchema>
