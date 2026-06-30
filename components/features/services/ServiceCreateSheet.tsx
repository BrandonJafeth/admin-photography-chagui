'use client'

import { useState, useRef } from 'react'
import { useCreateService, useServices } from '@/hooks/useServices'
import { slugify } from '@/lib/validations/services'
import { uploadToCloudinary, getImageValidationError } from '@/lib/cloudinary'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StringListField } from '@/components/ui/StringListField'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Upload, Loader2 } from 'lucide-react'

interface ServiceCreateSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ServiceCreateSheet({
  isOpen,
  onOpenChange,
}: ServiceCreateSheetProps) {
  const { data: services = [] } = useServices()
  const createService = useCreateService()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [detailedDescription, setDetailedDescription] = useState('')
  const [features, setFeatures] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = getImageValidationError(file)
    if (validationError) {
      setUploadError(validationError)
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }

    setUploadError(null)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const reset = () => {
    setTitle('')
    setSlug('')
    setSlugTouched(false)
    setDescription('')
    setDetailedDescription('')
    setFeatures([])
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const hasValidationErrors = () => {
    if (!title || title.length < 3 || title.length > 200) return true
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.startsWith('-') || slug.endsWith('-')) return true
    if (!description || description.length < 20 || description.length > 2000) return true
    if (!selectedFile) return true
    return false
  }

  const handleCreate = async () => {
    if (hasValidationErrors()) return

    const loadingToast = toast.loading('Creando servicio...', {
      description: selectedFile ? 'Subiendo imagen y guardando...' : 'Guardando...',
    })

    try {
      const nextOrder = services.length > 0 ? Math.max(...services.map(s => s.order)) + 1 : 0

      let uploadedImageUrl = ''

      if (selectedFile) {
        try {
          const result = await uploadToCloudinary(selectedFile, 'photographic-images/services')
          uploadedImageUrl = result.url
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen'
          setUploadError(errorMessage)
          toast.dismiss(loadingToast)
          toast.error('Error al subir imagen', {
            description: errorMessage,
          })
          return
        }
      }

      await createService.mutateAsync({
        title,
        slug,
        description,
        detailed_description: detailedDescription || undefined,
        features: features.filter(f => f.trim().length > 0),
        image: uploadedImageUrl,
        order: nextOrder,
        is_active: true,
      })

      toast.dismiss(loadingToast)
      toast.success('¡Servicio creado!', {
        description: `El servicio "${title}" se creó correctamente`,
      })

      reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Error al crear servicio:', error)
      toast.dismiss(loadingToast)

      let errorMessage = 'No se pudo crear el servicio. Intenta nuevamente.'

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        const dbError = error as any

        if (dbError.code === '23505') {
          if (dbError.message?.includes('services_slug_key')) {
            errorMessage = `El slug "${slug}" ya está en uso. Por favor elige otro.`
          } else {
            errorMessage = 'Ya existe un servicio con estos datos. Verifica el título o slug.'
          }
        } else if (dbError.message) {
          errorMessage = dbError.message
        } else if (dbError.error) {
          errorMessage = dbError.error
        }
      }

      toast.error('Error al crear servicio', {
        description: errorMessage,
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
          <SheetHeader className="px-6 py-4">
            <SheetTitle className="text-xl">Crear Nuevo Servicio</SheetTitle>
            <SheetDescription>
              Agrega un nuevo servicio a tu portafolio
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* Preview */}
          {previewUrl ? (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Vista Previa</Label>
              <div className="relative aspect-video overflow-hidden rounded-lg border-2 border-white/10 bg-white/5">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : null}

          {/* Upload Imagen */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Imagen del Servicio *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={createService.isPending}
              className="w-full gap-2 h-11"
            >
              <Upload className="w-4 h-4" />
              {selectedFile ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
            </Button>
            {uploadError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                {uploadError}
              </p>
            )}
            {!selectedFile && (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                La imagen es requerida
              </p>
            )}
            <p className="text-xs text-white/40">
              Formatos: JPEG, PNG, WebP, GIF • Máximo: 5MB
            </p>
          </div>

          {/* Título */}
          <div className="space-y-2 border-t border-white/10 pt-6">
            <Label htmlFor="title" className="text-sm font-medium">
              Título *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Ej: BODAS"
            />
            {title && title.length < 3 && (
              <p className="text-xs text-amber-400">El título debe tener al menos 3 caracteres</p>
            )}
            {title && title.length > 200 && (
              <p className="text-xs text-red-400">El título es demasiado largo (máximo 200 caracteres)</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm font-medium">
              Slug (URL) *
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={e => {
                setSlugTouched(true)
                setSlug(e.target.value.toLowerCase())
              }}
              placeholder="Ej: bodas"
              className="font-mono text-sm"
            />
            {slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && (
              <p className="text-xs text-red-400">
                Solo letras minúsculas, números y guiones (ejemplo: fotografia-bodas)
              </p>
            )}
            <p className="text-xs text-white/40">Se genera automáticamente desde el título, pero puedes editarlo</p>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descripción * ({description.length}/2000)
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full min-h-[100px] px-3 py-2.5 border rounded-md resize-y bg-[#0d0d0d] border-white/15 text-white text-sm leading-relaxed focus:ring-2 focus:ring-white/10 focus:border-white/40 outline-none"
              placeholder="Describe el servicio de manera clara y concisa..."
            />
            {description && description.length < 20 && (
              <p className="text-xs text-amber-400">La descripción debe tener al menos 20 caracteres</p>
            )}
          </div>

          {/* Descripción detallada */}
          <div className="space-y-2">
            <Label htmlFor="detailedDescription" className="text-sm font-medium">
              Descripción Detallada (opcional)
            </Label>
            <textarea
              id="detailedDescription"
              value={detailedDescription}
              onChange={e => setDetailedDescription(e.target.value)}
              className="w-full min-h-[100px] px-3 py-2.5 border rounded-md resize-y bg-[#0d0d0d] border-white/15 text-white text-sm leading-relaxed focus:ring-2 focus:ring-white/10 focus:border-white/40 outline-none"
              placeholder="Información ampliada que se muestra en la página del servicio..."
            />
          </div>

          {/* Features */}
          <div className="border-t border-white/10 pt-6">
            <StringListField
              label="Características"
              items={features}
              onChange={setFeatures}
              placeholder="Ej: 8 horas de cobertura"
              disabled={createService.isPending}
            />
          </div>

          {hasValidationErrors() && (
            <div className="text-sm text-amber-400 flex items-center gap-2 -mt-4">
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
              Por favor completa todos los campos requeridos correctamente
            </div>
          )}

          {/* Actions */}
          <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 -mx-6 px-6 py-4 flex gap-3">
            <Button
              onClick={handleCreate}
              disabled={createService.isPending || hasValidationErrors()}
              className="flex-1 h-11"
            >
              {createService.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </span>
              ) : (
                'Crear Servicio'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                onOpenChange(false)
              }}
              className="h-11"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
