import { z } from 'zod'

const nullableText = () =>
  z.string().trim().transform((value) => value || null)

export const rackLocationSchema = z.object({
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  code: z.string().min(1, 'Code is required').max(50, 'Code is too long'),
  description: nullableText(),
})

export type RackLocationFormInput = z.input<typeof rackLocationSchema>
export type RackLocationFormValues = z.output<typeof rackLocationSchema>
