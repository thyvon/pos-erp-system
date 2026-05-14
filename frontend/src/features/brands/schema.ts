import { z } from 'zod'

const nullableText = (max?: number) => {
  const text = max ? z.string().max(max) : z.string()
  return z.union([text, z.literal('')]).transform((value) => value || null)
}

const nullableUrl = z
  .union([z.string().url('Invalid URL').max(500), z.literal('')])
  .transform((value) => value || null)

export const brandSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name is too long'),
  description: nullableText(),
  image_url: nullableUrl,
  image_file: z.custom<File | null>(
    (value) => value === null || (typeof File !== 'undefined' && value instanceof File)
  ),
})

export type BrandFormInput = z.input<typeof brandSchema>
export type BrandFormValues = z.output<typeof brandSchema>
