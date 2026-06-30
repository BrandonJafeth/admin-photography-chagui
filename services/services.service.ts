// services/services.service.ts
import { createClient } from '@/lib/supabase/client'
import { deleteFromCloudinary } from '@/lib/cloudinary'

export interface Service {
  id: string
  title: string
  slug: string
  description: string
  detailed_description: string | null
  image: string | null
  features: string[] | null
  is_active: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface CreateServicePayload {
  title: string
  slug: string
  description: string
  detailed_description?: string
  image?: string
  features?: string[]
  is_active?: boolean
  order?: number
}

export interface UpdateServicePayload {
  title?: string
  slug?: string
  description?: string
  detailed_description?: string
  image?: string
  features?: string[]
  is_active?: boolean
  order?: number
}

/**
 * Servicio para gestionar servicios
 */
export class ServicesService {
  /**
   * Obtiene todos los servicios ordenados
   */
  static async getAll(): Promise<Service[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('order', { ascending: true })

    if (error) throw new Error(`Error al obtener servicios: ${error.message}`)

    return data || []
  }

  /**
   * Obtiene un servicio por ID
   */
  static async getById(id: string): Promise<Service> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(`Error al obtener servicio: ${error.message}`)

    return data
  }

  /**
   * Obtiene un servicio por slug
   */
  static async getBySlug(slug: string): Promise<Service> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw new Error(`Error al obtener servicio: ${error.message}`)

    return data
  }

  /**
   * Crea un nuevo servicio
   */
  static async create(payload: CreateServicePayload): Promise<Service> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .insert({
        ...payload,
        order: payload.order ?? 0,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single()

    if (error) throw new Error(`Error al crear servicio: ${error.message}`)

    return data
  }

  /**
   * Actualiza un servicio
   */
  static async update(id: string, payload: UpdateServicePayload): Promise<Service> {
    const supabase = createClient()

    // Obtener el servicio actual antes de actualizar para eliminar la imagen anterior
    const { data: currentService, error: fetchError } = await supabase
      .from('services')
      .select('image')
      .eq('id', id)
      .single()

    if (fetchError) throw new Error(`Error al obtener servicio: ${fetchError.message}`)

    // Eliminar imagen anterior de Cloudinary si se está reemplazando
    if (payload.image && currentService.image && payload.image !== currentService.image) {
      try {
        await deleteFromCloudinary(currentService.image)
      } catch (error) {
        console.error('Error al eliminar imagen anterior de Cloudinary:', error)
        // Continuar con la actualización aunque falle la eliminación
      }
    }

    // Actualizar el servicio
    const { data, error } = await supabase
      .from('services')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error al actualizar servicio: ${error.message}`)

    return data
  }

  /**
   * Elimina un servicio
   */
  static async delete(id: string): Promise<void> {
    const supabase = createClient()

    // Obtener el servicio antes de eliminarlo para poder eliminar la imagen relacionada
    const { data: service, error: fetchError } = await supabase
      .from('services')
      .select('id, image')
      .eq('id', id)
      .single()

    if (fetchError) throw new Error(`Error al obtener servicio: ${fetchError.message}`)

    // Eliminar imagen principal del servicio de Cloudinary
    if (service.image) {
      await deleteFromCloudinary(service.image)
    }

    // Eliminar el servicio de la base de datos (FAQs y paquetes se eliminan/desvinculan por FK)
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error al eliminar servicio: ${error.message}`)
  }

  /**
   * Actualiza el orden de múltiples servicios
   */
  static async updateOrder(updates: Array<{ id: string; order: number }>): Promise<void> {
    const supabase = createClient()
    const promises = updates.map(({ id, order }) =>
      supabase
        .from('services')
        .update({ order, updated_at: new Date().toISOString() })
        .eq('id', id)
    )

    const results = await Promise.all(promises)
    const errors = results.filter(r => r.error)

    if (errors.length > 0) {
      throw new Error(`Error al actualizar orden: ${errors[0].error?.message}`)
    }
  }
}
