// lib/validations/services.ts
import { z } from 'zod'

// Regex para slug: solo letras minúsculas, números y guiones
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const serviceSchema = z.object({
  title: z.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título es demasiado largo'),

  slug: z.string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(200, 'El slug es demasiado largo')
    .regex(slugRegex, 'Solo letras minúsculas, números y guiones. Ej: fotografia-bodas')
    .refine((val) => !val.startsWith('-') && !val.endsWith('-'), {
      message: 'El slug no puede empezar ni terminar con guión',
    }),

  description: z.string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(2000, 'La descripción es demasiado larga'),

  detailed_description: z.string()
    .max(5000, 'La descripción detallada es demasiado larga')
    .optional(),

  image: z.string()
    .url('Debe ser una URL válida')
    .optional()
    .or(z.literal('')),

  features: z.array(z.string().min(1, 'El ítem no puede estar vacío')).default([]),

  is_active: z.boolean().default(true),

  order: z.number().int().min(0).default(0),
})

export type ServiceFormData = z.infer<typeof serviceSchema>

// Schema para crear servicio
export const createServiceSchema = serviceSchema.omit({
  detailed_description: true,
})

export type CreateServiceFormData = z.infer<typeof createServiceSchema>

// Schema para actualizar servicio (todos los campos opcionales excepto validaciones)
export const updateServiceSchema = serviceSchema.partial()

export type UpdateServiceFormData = z.infer<typeof updateServiceSchema>

/**
 * Genera un slug a partir de un texto (título)
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
