'use client'

import { useReducer, useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from '@/lib/toast'
import { uploadToCloudinary, deleteFromCloudinary, getImageValidationError } from '@/lib/cloudinary'
import {
  useServiceGallery,
  useCreateServiceGalleryImage,
  useUpdateServiceGalleryImage,
} from '@/hooks/useServiceGallery'
import { ServiceGalleryImage } from '@/services/service-gallery.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Upload, Loader2 } from 'lucide-react'

interface GalleryImageSheetProps {
  serviceId: string
  image: ServiceGalleryImage | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

type ImageState = {
  uploadError: string | null
  previewUrl: string | null
  selectedFile: File | null
}

type ImageAction =
  | { type: 'fileSelected'; file: File; previewUrl: string }
  | { type: 'validationFailed'; error: string }
  | { type: 'uploadFailed'; error: string }

const initialImageState: ImageState = {
  uploadError: null,
  previewUrl: null,
  selectedFile: null,
}

function imageReducer(state: ImageState, action: ImageAction): ImageState {
  switch (action.type) {
    case 'fileSelected':
      return { uploadError: null, selectedFile: action.file, previewUrl: action.previewUrl }
    case 'validationFailed':
      return { uploadError: action.error, selectedFile: null, previewUrl: null }
    case 'uploadFailed':
      return { ...state, uploadError: action.error }
  }
}

export function GalleryImageSheet({ serviceId, image, isOpen, onOpenChange }: GalleryImageSheetProps) {
  const { data: images = [] } = useServiceGallery(serviceId)
  const createImage = useCreateServiceGalleryImage()
  const updateImage = useUpdateServiceGalleryImage(serviceId)

  const [caption, setCaption] = useState(image?.caption || '')
  const [imageState, dispatchImage] = useReducer(imageReducer, initialImageState)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPending = createImage.isPending || updateImage.isPending
  const hasValidationErrors = () => (!image && !imageState.selectedFile)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = getImageValidationError(file)
    if (validationError) {
      dispatchImage({ type: 'validationFailed', error: validationError })
      return
    }

    dispatchImage({ type: 'fileSelected', file, previewUrl: URL.createObjectURL(file) })
  }

  const handleSubmit = async () => {
    if (hasValidationErrors()) return

    try {
      if (image) {
        await updateImage.mutateAsync({ id: image.id, payload: { caption } })
        toast.success('Imagen actualizada', {
          description: 'Los cambios se guardaron correctamente',
        })
        onOpenChange(false)
        return
      }

      if (!imageState.selectedFile) return

      let uploadedUrl = ''
      try {
        const result = await uploadToCloudinary(
          imageState.selectedFile,
          `photographic-images/services/gallery/${serviceId}`
        )
        uploadedUrl = result.url
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen'
        dispatchImage({ type: 'uploadFailed', error: errorMessage })
        toast.error('Error al subir imagen', { description: errorMessage })
        return
      }

      try {
        const nextOrder = images.length > 0 ? Math.max(...images.map(i => i.order)) + 1 : 0
        await createImage.mutateAsync({
          service_id: serviceId,
          image_url: uploadedUrl,
          caption: caption || undefined,
          order: nextOrder,
        })
      } catch (error) {
        // Evitar dejar una imagen huérfana en Cloudinary si falla el insert en la DB
        await deleteFromCloudinary(uploadedUrl)
        throw error
      }

      toast.success('Imagen agregada', {
        description: 'La imagen se agregó a la galería correctamente',
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar imagen de galería:', error)
      toast.error(image ? 'Error al actualizar' : 'Error al agregar imagen', {
        description: error instanceof Error ? error.message : 'Intenta nuevamente.',
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
          <SheetHeader className="px-6 py-4">
            <SheetTitle className="text-xl">{image ? 'Editar Imagen' : 'Nueva Imagen'}</SheetTitle>
            <SheetDescription>
              {image ? 'Actualiza el título de esta imagen' : 'Agrega una imagen a la galería de este servicio'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-6 space-y-6">
          {!image && (
            <>
              {imageState.previewUrl && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Vista Previa</Label>
                  <div className="relative aspect-video overflow-hidden rounded-lg border-2 border-white/10 bg-white/5">
                    <Image
                      src={imageState.previewUrl}
                      alt="Preview"
                      fill
                      unoptimized
                      sizes="(min-width: 640px) 42rem, 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Imagen *</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Seleccionar imagen"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className="w-full gap-2 h-11"
                >
                  <Upload className="w-4 h-4" />
                  {imageState.selectedFile ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
                </Button>
                {imageState.uploadError && (
                  <p className="text-xs text-red-400">{imageState.uploadError}</p>
                )}
                {!imageState.selectedFile && (
                  <p className="text-xs text-amber-400">La imagen es requerida</p>
                )}
                <p className="text-xs text-white/40">
                  Formatos: JPEG, PNG, WebP, GIF • Máximo: 5MB
                </p>
              </div>
            </>
          )}

          {image && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Imagen</Label>
              <div className="relative aspect-video overflow-hidden rounded-lg border-2 border-white/10 bg-white/5">
                <Image
                  src={image.image_url}
                  alt={image.caption || 'Imagen de galería'}
                  fill
                  unoptimized
                  sizes="(min-width: 640px) 42rem, 100vw"
                  className="object-cover"
                />
              </div>
              <p className="text-xs text-white/40">
                Para cambiar la imagen, elimina este item y agrega uno nuevo.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="caption" className="text-sm font-medium">Título (opcional)</Label>
            <Input
              id="caption"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Ej: Sesión en la playa"
              maxLength={200}
            />
          </div>

          <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 -mx-6 px-6 py-4 flex gap-3">
            <Button onClick={handleSubmit} disabled={isPending || hasValidationErrors()} className="flex-1 h-11">
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </span>
              ) : image ? (
                'Guardar Cambios'
              ) : (
                'Agregar Imagen'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">
              Cancelar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
