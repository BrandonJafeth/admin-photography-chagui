// lib/validations/packages.ts
import { z } from 'zod'

export const packageSchema = z.object({
  service_id: z.string().uuid().nullable().optional(),

  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'El nombre es demasiado largo'),

  price: z.number()
    .int('El precio debe ser un número entero')
    .positive('El precio debe ser mayor a 0'),

  description: z.string()
    .max(2000, 'La descripción es demasiado larga')
    .optional(),

  includes: z.array(z.string().min(1, 'El ítem no puede estar vacío')).default([]),

  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
})

export type PackageFormData = z.infer<typeof packageSchema>
