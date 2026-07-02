// lib/validations/services.ts
import { z } from 'zod'

export const serviceFormSchema = z.object({
  title: z.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título es demasiado largo (máximo 200 caracteres)'),

  description: z.string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(2000, 'La descripción es demasiado larga (máximo 2000 caracteres)'),

  detailedDescription: z.string()
    .max(5000, 'La descripción detallada es demasiado larga (máximo 5000 caracteres)')
    .optional(),
})

export type ServiceFormValues = z.infer<typeof serviceFormSchema>

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

/** Genera un slug único agregando -2, -3... si ya existe entre los slugs dados */
export function uniqueSlug(base: string, existingSlugs: Set<string>): string {
  const seed = base || 'servicio'
  if (!existingSlugs.has(seed)) return seed
  let i = 2
  while (existingSlugs.has(`${seed}-${i}`)) i++
  return `${seed}-${i}`
}
