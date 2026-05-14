import { z } from 'zod'

const nullableText = (max: number) =>
  z.union([z.string().max(max), z.literal('')]).transform((value) => value || null)

const nullableJsonObject = z.string().transform((value, ctx) => {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const parsed = JSON.parse(trimmed)
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid JSON object.',
      })

      return z.NEVER
    }

    return parsed as Record<string, unknown>
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter valid JSON.',
    })

    return z.NEVER
  }
})

export const branchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  code: nullableText(50),
  type: z.enum(['retail', 'warehouse', 'office', 'online']),
  phone: nullableText(20),
  email: z
    .union([z.string().email('Invalid email address').max(100), z.literal('')])
    .transform((value) => value || null),
  manager_id: z.union([z.string(), z.literal('')]).transform((value) => value || null),
  address: z.object({
    line1: nullableText(255),
    city: nullableText(100),
  }),
  is_default: z.boolean(),
  is_active: z.boolean(),
  business_hours: nullableJsonObject,
  invoice_settings: nullableJsonObject,
})

export type BranchFormInput = z.input<typeof branchSchema>
export type BranchFormValues = z.output<typeof branchSchema>
