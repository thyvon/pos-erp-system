import { z } from 'zod'

export const subUnitSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().min(1, 'Name is required').max(150, 'Name is too long'),
  short_name: z.string().min(1, 'Short name is required').max(50, 'Short name is too long'),
  conversion_factor: z.coerce
    .number()
    .gt(0, 'Conversion factor must be greater than zero'),
})

export const unitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name is too long'),
  short_name: z.string().min(1, 'Short name is required').max(50, 'Short name is too long'),
  allow_decimal: z.boolean(),
  sub_units: z.array(subUnitSchema),
})

export type UnitFormInput = z.input<typeof unitSchema>
export type UnitFormValues = z.output<typeof unitSchema>
