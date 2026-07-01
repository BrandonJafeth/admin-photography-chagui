'use client'

import { useReducer, useState, useRef } from 'react'
import Image from 'next/image'
import { useCreateService, useServices } from '@/hooks/useServices'
import { slugify } from '@/lib/validations/services'
import { uploadToCloudinary, getImageValidationError } from '@/lib/cloudinary'
import { toast } from '@/lib/toast'
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

type FormState = {
  title: string
  slug: string
  description: string
  detailedDescription: string
}

type FormAction =
  | { type: 'fieldChanged'; name: keyof FormState; value: string }
  | { type: 'reset' }

const initialFormState: FormState = {
  title: '',
  slug: '',
  description: '',
  detailedDescription: '',
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'fieldChanged':
      return { ...state, [action.name]: action.value }
    case 'reset':
      return initialFormState
  }
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
  | { type: 'reset' }

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
    case 'reset':
      return initialImageState
  }
}

function hasValidationErrors(form: FormState, image: ImageState) {
  const { title, slug, description } = form
  if (!title || title.length < 3 || title.length > 200) return true
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.startsWith('-') || slug.endsWith('-')) return true
  if (!description || description.length < 20 || description.length > 2000) return true
  if (!image.selectedFile) return true
  return false
}

interface ImageUploadFieldProps {
  image: ImageState
  fileInputRef: React.RefObject<HTMLInputElement | null>
  disabled: boolean
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function ImageUploadField({ image, fileInputRef, disabled, onSelect }: ImageUploadFieldProps) {
  return (
    <>
      {image.previewUrl ? (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Vista Previa</Label>
          <div className="relative aspect-video overflow-hidden rounded-lg border-2 border-white/10 bg-white/5">
            <Image
              src={image.previewUrl}
              alt="Preview"
              fill
              unoptimized
              sizes="(min-width: 640px) 42rem, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label className="text-sm font-medium">Imagen del Servicio *</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-label="Seleccionar imagen"
          onChange={onSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full gap-2 h-11"
        >
          <Upload className="w-4 h-4" />
          {image.selectedFile ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
        </Button>
        {image.uploadError && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            {image.uploadError}
          </p>
        )}
        {!image.selectedFile && (
          <p className="text-xs text-amber-400 flex items-center gap-1">
            La imagen es requerida
          </p>
        )}
        <p className="text-xs text-white/40">
          Formatos: JPEG, PNG, WebP, GIF • Máximo: 5MB
        </p>
      </div>
    </>
  )
}

interface ServiceFormFieldsProps {
  form: FormState
  onTitleChange: (value: string) => void
  onSlugChange: (value: string) => void
  onFieldChange: (name: keyof FormState, value: string) => void
}

function ServiceFormFields({ form, onTitleChange, onSlugChange, onFieldChange }: ServiceFormFieldsProps) {
  return (
    <>
      <div className="space-y-2 border-t border-white/10 pt-6">
        <Label htmlFor="title" className="text-sm font-medium">
          Título *
        </Label>
        <Input
          id="title"
          value={form.title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="Ej: BODAS"
        />
        {form.title && form.title.length < 3 && (
          <p className="text-xs text-amber-400">El título debe tener al menos 3 caracteres</p>
        )}
        {form.title && form.title.length > 200 && (
          <p className="text-xs text-red-400">El título es demasiado largo (máximo 200 caracteres)</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug" className="text-sm font-medium">
          Slug (URL) *
        </Label>
        <Input
          id="slug"
          value={form.slug}
          onChange={e => onSlugChange(e.target.value.toLowerCase())}
          placeholder="Ej: bodas"
          className="font-mono text-sm"
        />
        {form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug) && (
          <p className="text-xs text-red-400">
            Solo letras minúsculas, números y guiones (ejemplo: fotografia-bodas)
          </p>
        )}
        <p className="text-xs text-white/40">Se genera automáticamente desde el título, pero puedes editarlo</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Descripción * ({form.description.length}/2000)
        </Label>
        <textarea
          id="description"
          aria-label="Descripción"
          value={form.description}
          onChange={e => onFieldChange('description', e.target.value)}
          className="w-full min-h-[100px] px-3 py-2.5 border rounded-md resize-y bg-[#0d0d0d] border-white/15 text-white text-sm leading-relaxed focus:ring-2 focus:ring-white/10 focus:border-white/40 outline-none"
          placeholder="Describe el servicio de manera clara y concisa..."
        />
        {form.description && form.description.length < 20 && (
          <p className="text-xs text-amber-400">La descripción debe tener al menos 20 caracteres</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="detailedDescription" className="text-sm font-medium">
          Descripción Detallada (opcional)
        </Label>
        <textarea
          id="detailedDescription"
          aria-label="Descripción Detallada"
          value={form.detailedDescription}
          onChange={e => onFieldChange('detailedDescription', e.target.value)}
          className="w-full min-h-[100px] px-3 py-2.5 border rounded-md resize-y bg-[#0d0d0d] border-white/15 text-white text-sm leading-relaxed focus:ring-2 focus:ring-white/10 focus:border-white/40 outline-none"
          placeholder="Información ampliada que se muestra en la página del servicio..."
        />
      </div>
    </>
  )
}

interface ServiceCreateActionsProps {
  isPending: boolean
  disabled: boolean
  onCreate: () => void
  onCancel: () => void
}

function ServiceCreateActions({ isPending, disabled, onCreate, onCancel }: ServiceCreateActionsProps) {
  return (
    <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 -mx-6 px-6 py-4 flex gap-3">
      <Button
        onClick={onCreate}
        disabled={disabled}
        className="flex-1 h-11"
      >
        {isPending ? (
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
        onClick={onCancel}
        className="h-11"
      >
        Cancelar
      </Button>
    </div>
  )
}

export function ServiceCreateSheet({
  isOpen,
  onOpenChange,
}: ServiceCreateSheetProps) {
  const { data: services = [] } = useServices()
  const createService = useCreateService()

  const [form, dispatchForm] = useReducer(formReducer, initialFormState)
  const [image, dispatchImage] = useReducer(imageReducer, initialImageState)
  const slugTouchedRef = useRef(false)
  const [features, setFeatures] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFieldChange = (name: keyof FormState, value: string) => {
    dispatchForm({ type: 'fieldChanged', name, value })
  }

  const handleTitleChange = (value: string) => {
    handleFieldChange('title', value)
    if (!slugTouchedRef.current) {
      handleFieldChange('slug', slugify(value))
    }
  }

  const handleSlugChange = (value: string) => {
    slugTouchedRef.current = true
    handleFieldChange('slug', value)
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = getImageValidationError(file)
    if (validationError) {
      dispatchImage({ type: 'validationFailed', error: validationError })
      return
    }

    dispatchImage({ type: 'fileSelected', file, previewUrl: URL.createObjectURL(file) })
  }

  const reset = () => {
    dispatchForm({ type: 'reset' })
    slugTouchedRef.current = false
    setFeatures([])
    dispatchImage({ type: 'reset' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCreate = async () => {
    if (hasValidationErrors(form, image)) return

    const loadingToast = toast.loading('Creando servicio...', {
      description: image.selectedFile ? 'Subiendo imagen y guardando...' : 'Guardando...',
    })

    try {
      const nextOrder = services.length > 0 ? Math.max(...services.map(s => s.order)) + 1 : 0

      let uploadedImageUrl = ''

      if (image.selectedFile) {
        try {
          const result = await uploadToCloudinary(image.selectedFile, 'photographic-images/services')
          uploadedImageUrl = result.url
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen'
          dispatchImage({ type: 'uploadFailed', error: errorMessage })
          toast.dismiss(loadingToast)
          toast.error('Error al subir imagen', {
            description: errorMessage,
          })
          return
        }
      }

      await createService.mutateAsync({
        title: form.title,
        slug: form.slug,
        description: form.description,
        detailed_description: form.detailedDescription || undefined,
        features: features.filter(f => f.trim().length > 0),
        image: uploadedImageUrl,
        order: nextOrder,
        is_active: true,
      })

      toast.dismiss(loadingToast)
      toast.success('¡Servicio creado!', {
        description: `El servicio "${form.title}" se creó correctamente`,
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
            errorMessage = `El slug "${form.slug}" ya está en uso. Por favor elige otro.`
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
          <ImageUploadField
            image={image}
            fileInputRef={fileInputRef}
            disabled={createService.isPending}
            onSelect={handleImageSelect}
          />

          <ServiceFormFields
            form={form}
            onTitleChange={handleTitleChange}
            onSlugChange={handleSlugChange}
            onFieldChange={handleFieldChange}
          />

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

          {hasValidationErrors(form, image) && (
            <div className="text-sm text-amber-400 flex items-center gap-2 -mt-4">
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
              Por favor completa todos los campos requeridos correctamente
            </div>
          )}

          <ServiceCreateActions
            isPending={createService.isPending}
            disabled={createService.isPending || hasValidationErrors(form, image)}
            onCreate={handleCreate}
            onCancel={() => {
              reset()
              onOpenChange(false)
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
