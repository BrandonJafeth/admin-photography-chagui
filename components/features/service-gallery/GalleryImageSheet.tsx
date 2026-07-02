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
import { UploadCloud, Loader2, X, Check, AlertCircle } from 'lucide-react'

interface GalleryImageSheetProps {
  serviceId: string
  image: ServiceGalleryImage | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

type PendingStatus = 'pending' | 'uploading' | 'done' | 'error'

type PendingFile = {
  id: string
  file: File
  previewUrl: string
  status: PendingStatus
  error?: string
}

type QueueAction =
  | { type: 'filesAdded'; files: PendingFile[] }
  | { type: 'fileRemoved'; id: string }
  | { type: 'statusChanged'; id: string; status: PendingStatus; error?: string }
  | { type: 'reset' }

function queueReducer(state: PendingFile[], action: QueueAction): PendingFile[] {
  switch (action.type) {
    case 'filesAdded':
      return [...state, ...action.files]
    case 'fileRemoved':
      return state.filter(f => f.id !== action.id)
    case 'statusChanged':
      return state.map(f => (f.id === action.id ? { ...f, status: action.status, error: action.error } : f))
    case 'reset':
      return []
  }
}

function makePendingFile(file: File): PendingFile {
  return {
    id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
    file,
    previewUrl: URL.createObjectURL(file),
    status: 'pending',
  }
}

interface DropzoneProps {
  disabled: boolean
  onFiles: (files: File[]) => void
}

function Dropzone({ disabled, onFiles }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    onFiles(Array.from(fileList))
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        if (!disabled) handleFiles(e.dataTransfer.files)
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Seleccionar o arrastrar imágenes"
      className={`flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors duration-200 ${
        isDragging
          ? 'border-white/50 bg-white/[0.04]'
          : 'border-white/15 hover:border-white/30 bg-white/[0.02]'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        aria-label="Seleccionar imágenes"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
        className="hidden"
      />
      <div className="flex items-center justify-center h-11 w-11 rounded-full bg-white/5">
        <UploadCloud className="w-5 h-5 text-white/60" />
      </div>
      <p className="text-sm text-white/80">
        Arrastra imágenes aquí o <span className="text-white underline underline-offset-2">haz click</span>
      </p>
      <p className="text-xs text-white/40">Podés seleccionar varias a la vez • JPEG, PNG, WebP, GIF • Máximo 5MB c/u</p>
    </div>
  )
}

interface PendingGridProps {
  items: PendingFile[]
  disabled: boolean
  onRemove: (id: string) => void
}

function PendingGrid({ items, disabled, onRemove }: PendingGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
      {items.map((item) => (
        <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5">
          <Image src={item.previewUrl} alt={item.file.name} fill unoptimized className="object-cover" />

          {item.status === 'pending' && !disabled && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="absolute top-1 right-1 flex items-center justify-center h-5 w-5 rounded-full bg-black/70 text-white/80 hover:text-white hover:bg-black/90"
              aria-label={`Quitar ${item.file.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {item.status === 'uploading' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
          )}
          {item.status === 'done' && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-emerald-500/90 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          )}
          {item.status === 'error' && (
            <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center" title={item.error}>
              <AlertCircle className="w-5 h-5 text-red-300" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function GalleryImageSheet({ serviceId, image, isOpen, onOpenChange }: GalleryImageSheetProps) {
  const { data: images = [] } = useServiceGallery(serviceId)
  const createImage = useCreateServiceGalleryImage()
  const updateImage = useUpdateServiceGalleryImage(serviceId)

  const [caption, setCaption] = useState(image?.caption || '')
  const [queue, dispatchQueue] = useReducer(queueReducer, [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isPending = createImage.isPending || updateImage.isPending || isSubmitting
  const hasValidationErrors = () => (!image && queue.length === 0)

  const handleFilesAdded = (files: File[]) => {
    const validFiles: PendingFile[] = []
    for (const file of files) {
      const validationError = getImageValidationError(file)
      if (validationError) {
        toast.error(`"${file.name}" no es válida`, { description: validationError })
        continue
      }
      validFiles.push(makePendingFile(file))
    }
    if (validFiles.length > 0) {
      dispatchQueue({ type: 'filesAdded', files: validFiles })
    }
  }

  const handleSubmit = async () => {
    if (hasValidationErrors()) return

    if (image) {
      try {
        await updateImage.mutateAsync({ id: image.id, payload: { caption } })
        toast.success('Imagen actualizada', {
          description: 'Los cambios se guardaron correctamente',
        })
        onOpenChange(false)
      } catch (error) {
        console.error('Error al actualizar imagen de galería:', error)
        toast.error('Error al actualizar', {
          description: error instanceof Error ? error.message : 'Intenta nuevamente.',
        })
      }
      return
    }

    setIsSubmitting(true)
    let nextOrder = images.length > 0 ? Math.max(...images.map(i => i.order)) + 1 : 0
    let successCount = 0
    let failCount = 0

    for (const item of queue) {
      dispatchQueue({ type: 'statusChanged', id: item.id, status: 'uploading' })

      let uploadedUrl = ''
      try {
        const result = await uploadToCloudinary(item.file, `photographic-images/services/gallery/${serviceId}`)
        uploadedUrl = result.url
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen'
        dispatchQueue({ type: 'statusChanged', id: item.id, status: 'error', error: errorMessage })
        failCount++
        continue
      }

      try {
        await createImage.mutateAsync({
          service_id: serviceId,
          image_url: uploadedUrl,
          caption: queue.length === 1 ? (caption || undefined) : undefined,
          order: nextOrder,
        })
        nextOrder++
        successCount++
        dispatchQueue({ type: 'statusChanged', id: item.id, status: 'done' })
      } catch (error) {
        await deleteFromCloudinary(uploadedUrl)
        const errorMessage = error instanceof Error ? error.message : 'Error al guardar en la galería'
        dispatchQueue({ type: 'statusChanged', id: item.id, status: 'error', error: errorMessage })
        failCount++
      }
    }

    setIsSubmitting(false)

    if (successCount > 0 && failCount === 0) {
      toast.success(successCount === 1 ? 'Imagen agregada' : `${successCount} imágenes agregadas`, {
        description: 'Se guardaron correctamente en la galería',
      })
      onOpenChange(false)
    } else if (successCount > 0 && failCount > 0) {
      toast.error(`${successCount} de ${successCount + failCount} imágenes agregadas`, {
        description: 'Algunas imágenes fallaron. Quita las que fallaron o reintenta.',
      })
    } else {
      toast.error('Error al agregar imágenes', {
        description: 'No se pudo subir ninguna imagen. Intenta nuevamente.',
      })
    }
  }

  const submitLabel = image
    ? 'Guardar Cambios'
    : queue.length > 1
      ? `Agregar ${queue.length} Imágenes`
      : 'Agregar Imagen'

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
          <SheetHeader className="px-6 py-4">
            <SheetTitle className="text-xl">{image ? 'Editar Imagen' : 'Agregar Imágenes'}</SheetTitle>
            <SheetDescription>
              {image ? 'Actualiza el título de esta imagen' : 'Agrega una o varias imágenes a la galería de este servicio'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-6 space-y-6">
          {!image && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Imágenes *</Label>
              <Dropzone disabled={isPending} onFiles={handleFilesAdded} />
              {queue.length > 0 && (
                <PendingGrid items={queue} disabled={isPending} onRemove={(id) => dispatchQueue({ type: 'fileRemoved', id })} />
              )}
              {queue.length === 0 && (
                <p className="text-xs text-amber-400">Selecciona al menos una imagen</p>
              )}
            </div>
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

          {(image || queue.length <= 1) && (
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
          )}
          {!image && queue.length > 1 && (
            <p className="text-xs text-white/40 -mt-2">
              Podés agregar título a cada imagen luego, editándola individualmente.
            </p>
          )}

          <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 -mx-6 px-6 py-4 flex gap-3">
            <Button onClick={handleSubmit} disabled={isPending || hasValidationErrors()} className="flex-1 h-11">
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                submitLabel
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="h-11">
              Cancelar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
