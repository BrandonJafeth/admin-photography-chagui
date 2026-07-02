// services/service-gallery.service.ts
import { createClient } from '@/lib/supabase/client'
import { deleteFromCloudinary } from '@/lib/cloudinary'

export interface ServiceGalleryImage {
  id: string
  service_id: string
  image_url: string
  caption: string | null
  order: number
}

export interface CreateServiceGalleryImagePayload {
  service_id: string
  image_url: string
  caption?: string
  order?: number
}

export interface UpdateServiceGalleryImagePayload {
  caption?: string
  order?: number
}

export class ServiceGalleryService {
  static async getByServiceId(serviceId: string): Promise<ServiceGalleryImage[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('service_gallery')
      .select('*')
      .eq('service_id', serviceId)
      .order('order', { ascending: true })

    if (error) throw new Error(`Error al obtener galería: ${error.message}`)

    return data || []
  }

  static async create(payload: CreateServiceGalleryImagePayload): Promise<ServiceGalleryImage> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('service_gallery')
      .insert({
        ...payload,
        order: payload.order ?? 0,
      })
      .select()
      .single()

    if (error) throw new Error(`Error al agregar imagen a la galería: ${error.message}`)

    return data
  }

  static async update(id: string, payload: UpdateServiceGalleryImagePayload): Promise<ServiceGalleryImage> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('service_gallery')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error al actualizar imagen de la galería: ${error.message}`)

    return data
  }

  static async delete(id: string): Promise<void> {
    const supabase = createClient()

    const { data: image, error: fetchError } = await supabase
      .from('service_gallery')
      .select('image_url')
      .eq('id', id)
      .single()

    if (fetchError) throw new Error(`Error al obtener imagen de la galería: ${fetchError.message}`)

    if (image.image_url) {
      await deleteFromCloudinary(image.image_url)
    }

    const { error } = await supabase
      .from('service_gallery')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error al eliminar imagen de la galería: ${error.message}`)
  }

  static async updateOrder(updates: Array<{ id: string; order: number }>): Promise<void> {
    const supabase = createClient()
    const promises = updates.map(({ id, order }) =>
      supabase.from('service_gallery').update({ order }).eq('id', id)
    )

    const results = await Promise.all(promises)
    const errors = results.filter(r => r.error)

    if (errors.length > 0) {
      throw new Error(`Error al actualizar orden de la galería: ${errors[0].error?.message}`)
    }
  }
}
