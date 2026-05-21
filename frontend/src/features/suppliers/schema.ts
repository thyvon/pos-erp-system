import { z } from 'zod'

const nullableText = (max: number) =>
  z
    .union([z.string().max(max), z.literal(''), z.null(), z.undefined()])
    .transform((value) => value || null)

const nullableNumber = z
  .union([z.literal(''), z.null(), z.undefined(), z.coerce.number().min(0)])
  .transform((value) => (value === '' || value === null || value === undefined ? null : value))

const customFieldsSchema = z.preprocess((value) => {
  if (value === null || value === undefined) return {}
  if (Array.isArray(value) && value.length === 0) return {}
  return value
}, z.record(z.string(), z.unknown()).default({}))

export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(191, 'Name is too long'),
  company: nullableText(191),
  email: z
    .union([z.literal(''), z.null(), z.undefined(), z.string().email('Invalid email address').max(191)])
    .transform((value) => value || null),
  phone: nullableText(50),
  mobile: nullableText(50),
  tax_id: nullableText(100),
  village: nullableText(100),
  commune: nullableText(100),
  district: nullableText(100),
  province_city: nullableText(100),
  country: nullableText(100),
  pay_term: z
    .union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0).max(3650)])
    .transform((value) => (value === '' || value === null || value === undefined ? null : value)),
  opening_balance: nullableNumber,
  status: z.enum(['active', 'inactive']),
  notes: z
    .union([z.string(), z.literal(''), z.null(), z.undefined()])
    .transform((value) => value || null),
  documents_text: z.string().max(10000, 'Documents are too long'),
  custom_fields: customFieldsSchema,
})

export type SupplierFormInput = z.input<typeof supplierSchema>
export type SupplierFormValues = z.output<typeof supplierSchema>
