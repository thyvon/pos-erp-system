import { z } from 'zod'

export const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Role name is required')
    .max(125, 'Role name is too long')
    .refine((value) => value.toLowerCase() !== 'super_admin', 'The super_admin role cannot be managed here'),
  permissions: z.array(z.string()),
})

export type RoleFormValues = z.infer<typeof roleSchema>
