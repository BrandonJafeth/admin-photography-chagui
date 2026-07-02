// lib/validations/packages.ts
import { z } from 'zod'

export const packageFormSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'El nombre es demasiado largo (máximo 200 caracteres)'),

  description: z.string()
    .max(2000, 'La descripción es demasiado larga (máximo 2000 caracteres)')
    .optional(),
})

export type PackageFormValues = z.infer<typeof packageFormSchema>
