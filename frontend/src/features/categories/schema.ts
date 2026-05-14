import { z } from 'zod'

const nullableText = (max: number) =>
  z.union([z.string().max(max), z.literal('')]).transform((value) => value || null)

const nullableUrl = z
  .union([z.string().url('Invalid URL').max(500), z.literal('')])
  .transform((value) => value || null)

export const categorySchema = z.object({
  parent_id: z.union([z.string().uuid(), z.literal('')]).transform((value) => value || null),
  name: z.string().min(1, 'Name is required').max(150, 'Name is too long'),
  code: nullableText(50),
  short_code: nullableText(10),
  image_url: nullableUrl,
  sort_order: z
    .union([z.coerce.number().int().min(0).max(65535), z.literal('')])
    .transform((value) => (value === '' ? null : value)),
})

export type CategoryFormInput = z.input<typeof categorySchema>
export type CategoryFormValues = z.output<typeof categorySchema>
