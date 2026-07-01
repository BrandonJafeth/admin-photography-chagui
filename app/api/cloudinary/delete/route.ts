import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function extractPublicId(url: string): string | null {
  try {
    const uploadIndex = url.indexOf('/image/upload/')
    if (uploadIndex === -1) {
      console.warn(`URL no es de Cloudinary: ${url}`)
      return null
    }

    const afterUpload = url.substring(uploadIndex + '/image/upload/'.length)
    const parts = afterUpload.split('/')
    let publicIdParts: string[] = []
    let foundPublicId = false

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]

      if (/\./.test(part)) {
        const filename = part.replace(/\.(jpg|jpeg|png|webp|gif|avif)$/i, '')
        publicIdParts.push(filename)
        foundPublicId = true
        break
      }

      if (/^(v\d+|w_|h_|c_|q_|f_|ar_|dpr_|e_|fl_|g_|l_|o_|r_|t_|u_|x_|y_|z_)/.test(part)) {
        continue
      }

      publicIdParts.push(part)
      foundPublicId = true
    }

    if (!foundPublicId || publicIdParts.length === 0) {
      console.warn(`No se pudo extraer public_id de la URL: ${url}`)
      return null
    }

    return publicIdParts.join('/')
  } catch (error) {
    console.error('Error extracting public_id:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary credentials missing' },
        { status: 500 }
      )
    }

    const publicId = extractPublicId(url)
    
    if (!publicId) {
      console.error(`Could not extract public_id from URL: ${url}`)
      return NextResponse.json(
        { error: 'Invalid Cloudinary URL - could not extract public_id', url },
        { status: 400 }
      )
    }
    
    console.log('Attempting to delete from Cloudinary:', {
      url,
      publicId,
      cloudName,
    })
    
    const timestamp = Math.round(new Date().getTime() / 1000)

    // Generar firma SHA-1
    // Formato según documentación de Cloudinary:
    // signature = SHA1(public_id={public_id}&timestamp={timestamp}{api_secret})
    const message = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha1').update(message).digest('hex')

    const requestBody = {
      public_id: publicId,
      timestamp,
      signature,
      api_key: apiKey,
    }

    console.log('Cloudinary delete request:', {
      publicId,
      timestamp,
      signature: signature.substring(0, 10) + '...', // Solo primeros 10 caracteres por seguridad
      apiKey: apiKey.substring(0, 5) + '...', // Solo primeros 5 caracteres por seguridad
    })

    // Eliminar de Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    const responseText = await response.text()
    let responseData: any
    
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw: responseText }
    }

    if (!response.ok) {
      console.error('Cloudinary delete error:', {
        url,
        publicId,
        error: responseData,
        status: response.status,
        requestBody: {
          ...requestBody,
          signature: '***',
          api_key: '***',
        },
      })
      return NextResponse.json(
        { 
          error: 'Failed to delete from Cloudinary', 
          details: responseData, 
          publicId, 
          url,
          status: response.status,
        },
        { status: response.status }
      )
    }

    console.log('Successfully deleted from Cloudinary:', { 
      publicId, 
      url, 
      result: responseData,
    })
    return NextResponse.json({ success: true, result: responseData, publicId })
  } catch (error) {
    console.error('Error in Cloudinary delete API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

