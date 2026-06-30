// services/service-faqs.service.ts
import { createClient } from '@/lib/supabase/client'

export interface ServiceFaq {
  id: string
  service_id: string
  question: string
  answer: string
  order: number
  is_active: boolean
}

export interface CreateServiceFaqPayload {
  service_id: string
  question: string
  answer: string
  order?: number
  is_active?: boolean
}

export interface UpdateServiceFaqPayload {
  question?: string
  answer?: string
  order?: number
  is_active?: boolean
}

/**
 * Servicio para gestionar las preguntas frecuentes de un servicio
 */
export class ServiceFaqsService {
  /**
   * Obtiene todas las FAQs de un servicio ordenadas
   */
  static async getByServiceId(serviceId: string): Promise<ServiceFaq[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('service_faqs')
      .select('*')
      .eq('service_id', serviceId)
      .order('order', { ascending: true })

    if (error) throw new Error(`Error al obtener preguntas frecuentes: ${error.message}`)

    return data || []
  }

  /**
   * Crea una nueva FAQ
   */
  static async create(payload: CreateServiceFaqPayload): Promise<ServiceFaq> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('service_faqs')
      .insert({
        ...payload,
        order: payload.order ?? 0,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single()

    if (error) throw new Error(`Error al crear pregunta frecuente: ${error.message}`)

    return data
  }

  /**
   * Actualiza una FAQ
   */
  static async update(id: string, payload: UpdateServiceFaqPayload): Promise<ServiceFaq> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('service_faqs')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error al actualizar pregunta frecuente: ${error.message}`)

    return data
  }

  /**
   * Elimina una FAQ
   */
  static async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('service_faqs')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error al eliminar pregunta frecuente: ${error.message}`)
  }

  /**
   * Actualiza el orden de múltiples FAQs
   */
  static async updateOrder(updates: Array<{ id: string; order: number }>): Promise<void> {
    const supabase = createClient()
    const promises = updates.map(({ id, order }) =>
      supabase.from('service_faqs').update({ order }).eq('id', id)
    )

    const results = await Promise.all(promises)
    const errors = results.filter(r => r.error)

    if (errors.length > 0) {
      throw new Error(`Error al actualizar orden: ${errors[0].error?.message}`)
    }
  }
}
