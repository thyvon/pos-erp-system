import { z } from 'zod'

const nullableText = (max: number) =>
  z.union([z.string().max(max), z.literal('')]).transform((value) => value || null)

const nullableUrl = z
  .union([z.string().url('Invalid URL').max(500, 'URL is too long'), z.literal('')])
  .transform((value) => value || null)

const countryCode = z
  .string()
  .trim()
  .max(100, 'Country name is too long')
  .transform((value) => value || null)

export const businessProfileSchema = z.object({
  name: z.string().trim().min(1, 'Business name is required').max(255, 'Business name is too long'),
  legal_name: nullableText(255),
  tax_id: nullableText(50),
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  phone: nullableText(20),
  business_country: countryCode,
  logo_url: nullableUrl,
  logo_file: z.custom<File | null>(
    (value) => value === null || (typeof File !== 'undefined' && value instanceof File)
  ),
  address_line1: nullableText(255),
  address_line2: nullableText(255),
  country: nullableText(100),
  province_city: nullableText(100),
  district: nullableText(100),
  commune: nullableText(100),
  village: nullableText(100),
})

export type BusinessProfileFormInput = z.input<typeof businessProfileSchema>
export type BusinessProfileFormValues = z.output<typeof businessProfileSchema>
