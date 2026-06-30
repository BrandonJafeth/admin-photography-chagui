// services/packages.service.ts
import { createClient } from '@/lib/supabase/client'

export interface Package {
  id: string
  service_id: string | null
  name: string
  price: number
  description: string | null
  includes: string[] | null
  is_active: boolean
  is_featured: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface CreatePackagePayload {
  service_id?: string | null
  name: string
  price: number
  description?: string
  includes?: string[]
  is_active?: boolean
  is_featured?: boolean
  order?: number
}

export interface UpdatePackagePayload {
  service_id?: string | null
  name?: string
  price?: number
  description?: string
  includes?: string[]
  is_active?: boolean
  is_featured?: boolean
  order?: number
}

/**
 * Servicio para gestionar paquetes
 */
export class PackagesService {
  /**
   * Obtiene todos los paquetes ordenados
   */
  static async getAll(): Promise<Package[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('order', { ascending: true })

    if (error) throw new Error(`Error al obtener paquetes: ${error.message}`)

    return data || []
  }

  /**
   * Obtiene un paquete por ID
   */
  static async getById(id: string): Promise<Package> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(`Error al obtener paquete: ${error.message}`)

    return data
  }

  /**
   * Crea un nuevo paquete
   */
  static async create(payload: CreatePackagePayload): Promise<Package> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('packages')
      .insert({
        ...payload,
        service_id: payload.service_id || null,
        order: payload.order ?? 0,
        is_active: payload.is_active ?? true,
        is_featured: payload.is_featured ?? false,
      })
      .select()
      .single()

    if (error) throw new Error(`Error al crear paquete: ${error.message}`)

    return data
  }

  /**
   * Actualiza un paquete
   */
  static async update(id: string, payload: UpdatePackagePayload): Promise<Package> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('packages')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error al actualizar paquete: ${error.message}`)

    return data
  }

  /**
   * Elimina un paquete
   */
  static async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error al eliminar paquete: ${error.message}`)
  }
}
