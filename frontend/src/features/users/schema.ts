import { z } from 'zod'

const nullableText = (max: number) =>
  z.union([z.string().max(max), z.literal('')]).transform((value) => value || null)

const nullableNumber = (min: number, max?: number) =>
  z.string().transform((value, ctx) => {
    const trimmed = value.trim()
    if (!trimmed) return null

    const numberValue = Number(trimmed)
    if (Number.isNaN(numberValue) || numberValue < min || (max !== undefined && numberValue > max)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: max === undefined ? `Enter a number ${min} or higher.` : `Enter a number from ${min} to ${max}.`,
      })

      return z.NEVER
    }

    return numberValue
  })

export const userSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  password: z.string(),
  phone: nullableText(20),
  avatar_url: z
    .union([z.string().url('Invalid URL').max(500, 'URL is too long'), z.literal('')])
    .transform((value) => value || null),
  status: z.enum(['active', 'inactive', 'suspended']),
  max_discount: nullableNumber(0, 100),
  commission_percentage: nullableNumber(0, 100),
  sales_target_amount: nullableNumber(0),
  preference_locale: z.enum(['en', 'km']),
  preference_timezone: z.string().min(1, 'Timezone is required').max(100, 'Timezone is too long'),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
  direct_permissions: z.array(z.string()),
  branch_ids: z.array(z.string()),
  warehouse_ids: z.array(z.string()),
  default_branch_id: z.union([z.string(), z.literal('')]).transform((value) => value || null),
})

export type UserFormInput = z.input<typeof userSchema>
export type UserFormValues = z.output<typeof userSchema>
