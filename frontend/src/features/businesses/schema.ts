import { z } from 'zod'

const nullableText = (max: number) =>
  z.union([z.string().max(max), z.literal('')]).transform((value) => value || null)

const nullableUrl = z
  .union([z.string().url('Invalid URL').max(500, 'URL is too long'), z.literal('')])
  .transform((value) => value || null)

const numberText = (min: number, max?: number) =>
  z.string().transform((value, ctx) => {
    const numberValue = Number(value)

    if (!Number.isInteger(numberValue) || numberValue < min || (max !== undefined && numberValue > max)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: max === undefined ? `Enter a whole number ${min} or higher.` : `Enter a whole number from ${min} to ${max}.`,
      })

      return z.NEVER
    }

    return numberValue
  })

const optionalNumberText = (min: number, max?: number) =>
  z.string().transform((value, ctx) => {
    const trimmed = value.trim()
    if (!trimmed) return null

    const numberValue = Number(trimmed)

    if (!Number.isInteger(numberValue) || numberValue < min || (max !== undefined && numberValue > max)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: max === undefined ? `Enter a whole number ${min} or higher.` : `Enter a whole number from ${min} to ${max}.`,
      })

      return z.NEVER
    }

    return numberValue
  })

export const managedBusinessSchema = z.object({
  name: z.string().trim().min(1, 'Business name is required').max(255, 'Business name is too long'),
  legal_name: nullableText(255),
  tax_id: nullableText(50),
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  phone: nullableText(20),
  currency: z.string().trim().length(3, 'Currency must be 3 letters').transform((value) => value.toUpperCase()),
  timezone: z.string().trim().min(1, 'Timezone is required').max(100, 'Timezone is too long'),
  country: z.string().trim().max(2, 'Country must be 2 letters').transform((value) => value ? value.toUpperCase() : null),
  locale: z.union([z.enum(['en', 'km']), z.literal('')]).transform((value) => value || null),
  logo_url: nullableUrl,
  tier: z.enum(['basic', 'standard', 'enterprise']),
  status: z.enum(['active', 'suspended', 'cancelled']),
  max_users: numberText(1),
  max_branches: numberText(1),
  address_line1: nullableText(255),
  address_line2: nullableText(255),
  address_city: nullableText(100),
  address_state: nullableText(100),
  address_postal_code: nullableText(30),
  address_country: z.string().trim().max(2, 'Country must be 2 letters').transform((value) => value ? value.toUpperCase() : null),
  financial_year_start_month: optionalNumberText(1, 12),
  financial_year_start_day: optionalNumberText(1, 31),
  owner_first_name: z.string().max(100, 'First name is too long'),
  owner_last_name: nullableText(100),
  owner_email: z.union([z.string().email('Invalid email address').max(255), z.literal('')]),
  owner_phone: nullableText(20),
  owner_password: z.string(),
})

export type ManagedBusinessFormInput = z.input<typeof managedBusinessSchema>
export type ManagedBusinessFormValues = z.output<typeof managedBusinessSchema>
