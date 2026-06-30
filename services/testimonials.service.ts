// services/testimonials.service.ts
import { createClient } from '@/lib/supabase/client'

export interface Testimonial {
  id: string
  client_name: string
  position: string | null
  text: string
  rating: number
  is_visible: boolean
  order: number
  created_at: string
}

export interface CreateTestimonialPayload {
  client_name: string
  position?: string
  text: string
  rating?: number
  is_visible?: boolean
  order?: number
}

export interface UpdateTestimonialPayload {
  client_name?: string
  position?: string
  text?: string
  rating?: number
  is_visible?: boolean
  order?: number
}

/**
 * Servicio para gestionar testimonios
 */
export class TestimonialsService {
  /**
   * Obtiene todos los testimonios ordenados
   */
  static async getAll(): Promise<Testimonial[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('order', { ascending: true })

    if (error) throw new Error(`Error al obtener testimonios: ${error.message}`)

    return data || []
  }

  /**
   * Crea un nuevo testimonio
   */
  static async create(payload: CreateTestimonialPayload): Promise<Testimonial> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        ...payload,
        rating: payload.rating ?? 5,
        is_visible: payload.is_visible ?? true,
        order: payload.order ?? 0,
      })
      .select()
      .single()

    if (error) throw new Error(`Error al crear testimonio: ${error.message}`)

    return data
  }

  /**
   * Actualiza un testimonio
   */
  static async update(id: string, payload: UpdateTestimonialPayload): Promise<Testimonial> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('testimonials')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error al actualizar testimonio: ${error.message}`)

    return data
  }

  /**
   * Elimina un testimonio
   */
  static async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error al eliminar testimonio: ${error.message}`)
  }

  /**
   * Actualiza el orden de múltiples testimonios
   */
  static async updateOrder(updates: Array<{ id: string; order: number }>): Promise<void> {
    const supabase = createClient()
    const promises = updates.map(({ id, order }) =>
      supabase.from('testimonials').update({ order }).eq('id', id)
    )

    const results = await Promise.all(promises)
    const errors = results.filter(r => r.error)

    if (errors.length > 0) {
      throw new Error(`Error al actualizar orden: ${errors[0].error?.message}`)
    }
  }
}
