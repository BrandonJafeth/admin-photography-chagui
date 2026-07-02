import { compressImage } from '@/lib/image-compression'

/**
 * Utilidades para subir imágenes a Cloudinary
 */

export interface CloudinaryUploadResponse {
  url: string
  publicId: string
  width: number
  height: number
}

/**
 * Sube una imagen a Cloudinary
 * @param file - Archivo a subir
 * @param folder - Carpeta en Cloudinary (default: 'photography')
 * @returns URL de la imagen y metadata
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'photography'
): Promise<CloudinaryUploadResponse> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing')
  }

  // Comprimir imagen antes de subir (max 2000px, 80% calidad)
  const compressedFile = await compressImage(file, 2000, 0.8)

  const formData = new FormData()
  formData.append('file', compressedFile)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', folder)

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to upload image')
    }

    const data = await response.json()

    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw error
  }
}

/**
 * Valida que el archivo sea una imagen
 */
function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 5 * 1024 * 1024 // 5MB

  return validTypes.includes(file.type) && file.size <= maxSize
}

/**
 * Obtiene el error de validación de imagen
 */
export function getImageValidationError(file: File): string | null {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!validTypes.includes(file.type)) {
    return 'El archivo debe ser una imagen (JPEG, PNG, WebP o GIF)'
  }

  if (file.size > maxSize) {
    return 'La imagen no debe superar 5MB'
  }

  return null
}

/**
 * Extrae el public_id de una URL de Cloudinary
 * @param url - URL de Cloudinary (ej: https://res.cloudinary.com/cloud/image/upload/v123/folder/image.jpg)
 * @returns public_id (ej: folder/image)
 */
function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Patrón para URLs de Cloudinary
    // https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}
    // Ejemplos:
    // - https://res.cloudinary.com/demo/image/upload/v1234567/hero/image.jpg -> public_id: "hero/image"
    // - https://res.cloudinary.com/demo/image/upload/w_400,q_80/hero/image.jpg -> public_id: "hero/image"
    // - https://res.cloudinary.com/demo/image/upload/v1234567/w_400,q_80/hero/image.jpg -> public_id: "hero/image"
    
    const uploadIndex = url.indexOf('/image/upload/')
    if (uploadIndex === -1) {
      console.warn(`URL no es de Cloudinary: ${url}`)
      return null
    }

    // Obtener todo después de /image/upload/
    const afterUpload = url.substring(uploadIndex + '/image/upload/'.length)
    
    // Separar por '/' para obtener las partes
    const parts = afterUpload.split('/')
    
    // Identificar dónde empieza el public_id
    // Las transformaciones pueden ser:
    // - v1234567 (versión)
    // - w_400,q_80 (ancho y calidad)
    // - v1234567/w_400,q_80 (combinación)
    // El public_id siempre está después de las transformaciones
    
    let publicIdParts: string[] = []
    let foundPublicId = false
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      
      if (/\./.test(part)) {
        // Remover la extensión
        const filename = part.replace(/\.(jpg|jpeg|png|webp|gif|avif)$/i, '')
        publicIdParts.push(filename)
        foundPublicId = true
        break
      }
      
      // Si la parte es una transformación (empieza con v, w_, h_, c_, etc.), la saltamos
      if (/^(v\d+|w_|h_|c_|q_|f_|ar_|dpr_|e_|fl_|g_|l_|o_|r_|t_|u_|x_|y_|z_)/.test(part)) {
        // Es una transformación, continuar
        continue
      }
      
      // Si llegamos aquí, es parte del public_id (carpeta o nombre)
      publicIdParts.push(part)
      foundPublicId = true
    }
    
    if (!foundPublicId || publicIdParts.length === 0) {
      console.warn(`No se pudo extraer public_id de la URL: ${url}`)
      return null
    }
    
    const publicId = publicIdParts.join('/')
    console.log(`Extracted public_id: "${publicId}" from URL: ${url}`)
    return publicId
  } catch (error) {
    console.error('Error extracting public_id from URL:', error)
    return null
  }
}

/**
 * Elimina una imagen de Cloudinary
 * @param url - URL de la imagen en Cloudinary
 * @returns true si se eliminó correctamente
 */
export async function deleteFromCloudinary(url: string): Promise<boolean> {
  // Si estamos en el cliente, usar API route
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/cloudinary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Cloudinary delete API error:', {
          url,
          status: response.status,
          error: errorData,
        })
        return false
      }
      
      const result = await response.json()
      return result.success === true
    } catch (error) {
      console.error('Error deleting from Cloudinary via API:', error)
      return false
    }
  }

  // Si estamos en el servidor, hacer la eliminación directamente
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('Cloudinary credentials missing, skipping deletion')
    return false
  }

  const publicId = extractPublicIdFromUrl(url)
  
  if (!publicId) {
    console.warn(`Could not extract public_id from URL: ${url}`)
    return false
  }

  try {
    // Generar signature para autenticación
    const timestamp = Math.round(new Date().getTime() / 1000)
    const signature = await generateCloudinarySignature(publicId, timestamp, apiSecret)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          timestamp,
          signature,
          api_key: apiKey,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Cloudinary delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    return false
  }
}

/**
 * Elimina múltiples imágenes de Cloudinary
 * @param urls - Array de URLs de imágenes en Cloudinary
 * @returns Número de imágenes eliminadas correctamente
 */
export async function deleteManyFromCloudinary(urls: string[]): Promise<number> {
  if (urls.length === 0) return 0

  const deletePromises = urls.map(url => deleteFromCloudinary(url))
  const results = await Promise.all(deletePromises)
  
  return results.filter(Boolean).length
}

/**
 * Genera la firma para autenticación en Cloudinary
 * @param publicId - Public ID de la imagen
 * @param timestamp - Timestamp actual
 * @param apiSecret - API Secret de Cloudinary
 * @returns Signature generada
 */
async function generateCloudinarySignature(
  publicId: string,
  timestamp: number,
  apiSecret: string
): Promise<string> {
  // Cloudinary usa SHA-256 para generar la firma
  // signature = SHA256(public_id + timestamp + api_secret)
  const message = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`

  // Usar Web Crypto API (disponible en navegador y Node.js 15+)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }
  
  // Si estamos en el servidor (Node.js), usar Node.js crypto
  // Nota: Esta función solo debería llamarse desde el servidor
  // En el cliente, deleteFromCloudinary usa la API route
  throw new Error('Unable to generate Cloudinary signature: crypto API not available. Use API route from client.')
}