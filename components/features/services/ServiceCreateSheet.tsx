'use client'

import { useReducer, useState, useRef } from 'react'
import Image from 'next/image'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateService, useServices } from '@/hooks/useServices'
import { serviceFormSchema, type ServiceFormValues, slugify, uniqueSlug } from '@/lib/validations/services'
import { uploadToCloudinary, getImageValidationError } from '@/lib/cloudinary'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StringListField } from '@/components/ui/StringListField'
import { ParagraphEditor } from '@/components/ui/paragraph-editor'
import { DisplayModeToggle } from './DisplayModeToggle'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Upload, Loader2 } from 'lucide-react'

interface ServiceCreateSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const defaultValues: ServiceFormValues = {
  title: '',
  description: '',
  detailedDescription: '',
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

interface ImageUploadFieldProps {
  image: ImageState
  fileInputRef: React.RefObject<HTMLInputElement | null>
  fileInputKey: number
  disabled: boolean
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  showRequiredError: boolean
}

function ImageUploadField({ image, fileInputRef, fileInputKey, disabled, onSelect, showRequiredError }: ImageUploadFieldProps) {
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
          key={fileInputKey}
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
        {!image.selectedFile && showRequiredError && (
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

export function ServiceCreateSheet({
  isOpen,
  onOpenChange,
}: ServiceCreateSheetProps) {
  const { data: services = [] } = useServices()
  const createService = useCreateService()

  const [image, dispatchImage] = useReducer(imageReducer, initialImageState)
  const [features, setFeatures] = useState<string[]>([])
  const [useCarousel, setUseCarousel] = useState(false)
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    reset: resetForm,
    formState: { errors, isSubmitting, isDirty: isFormDirty, isSubmitted },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const descriptionValue = useWatch({ control, name: 'description' })
  const isPending = createService.isPending || isSubmitting

  const isDirty = () =>
    isFormDirty ||
    features.some(f => f.trim() !== '') ||
    !!image.selectedFile

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
    resetForm(defaultValues)
    setFeatures([])
    setUseCarousel(false)
    dispatchImage({ type: 'reset' })
    setFileInputKey(k => k + 1)
  }

  const handleCancelClick = () => {
    if (isDirty()) {
      setConfirmDiscardOpen(true)
      return
    }
    reset()
    onOpenChange(false)
  }

  const confirmDiscard = () => {
    reset()
    setConfirmDiscardOpen(false)
    onOpenChange(false)
  }

  const handleSheetOpenChange = (open: boolean) => {
    if (!open && isDirty()) {
      setConfirmDiscardOpen(true)
      return
    }
    onOpenChange(open)
  }

  const onSubmit = async (values: ServiceFormValues) => {
    if (!image.selectedFile) return

    const loadingToast = toast.loading('Creando servicio...', {
      description: 'Subiendo imagen y guardando...',
    })

    try {
      const nextOrder = services.length > 0 ? Math.max(...services.map(s => s.order)) + 1 : 0
      const baseSlug = slugify(values.title) || 'servicio'
      const slug = uniqueSlug(baseSlug, new Set(services.map(s => s.slug)))

      let uploadedImageUrl = ''
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

      await createService.mutateAsync({
        title: values.title,
        slug,
        description: values.description,
        detailed_description: values.detailedDescription || undefined,
        features: features.filter(f => f.trim().length > 0),
        image: uploadedImageUrl,
        order: nextOrder,
        is_active: true,
        use_carousel: useCarousel,
      })

      toast.dismiss(loadingToast)
      toast.success('¡Servicio creado!', {
        description: `El servicio "${values.title}" se creó correctamente`,
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
        const dbError = error as { code?: string; message?: string; error?: string }

        if (dbError.code === '23505') {
          if (dbError.message?.includes('services_slug_key')) {
            errorMessage = 'Ya existe un servicio con un título muy similar. Cambia ligeramente el título e intenta de nuevo.'
          } else {
            errorMessage = 'Ya existe un servicio con estos datos. Verifica el título.'
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

  const errorList = [
    ...Object.values(errors).map(e => e?.message).filter((msg): msg is string => !!msg),
    ...(!image.selectedFile ? ['Selecciona una imagen para el servicio'] : []),
  ]

  const onFormSubmit = handleSubmit(onSubmit)

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
            <SheetHeader className="px-6 py-4">
              <SheetTitle className="text-xl">Crear Nuevo Servicio</SheetTitle>
              <SheetDescription>
                Agrega un nuevo servicio a tu portafolio · <span className="text-white/30">* campos requeridos</span>
              </SheetDescription>
            </SheetHeader>
          </div>

          <form onSubmit={onFormSubmit} className="px-6 py-6 space-y-8">
            <ImageUploadField
              image={image}
              fileInputRef={fileInputRef}
              fileInputKey={fileInputKey}
              disabled={isPending}
              onSelect={handleImageSelect}
              showRequiredError={isSubmitted}
            />

            <div className="space-y-2 border-t border-white/10 pt-6">
              <Label htmlFor="title" className="text-sm font-medium">
                Título *
              </Label>
              <Input id="title" placeholder="Ej: BODAS" {...register('title')} />
              {errors.title && (
                <p className="text-xs text-amber-400">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descripción * ({descriptionValue?.length ?? 0}/2000)
              </Label>
              <textarea
                id="description"
                aria-label="Descripción"
                className="w-full min-h-[100px] px-3 py-2.5 border rounded-md resize-y bg-[#0d0d0d] border-white/15 text-white text-sm leading-relaxed focus:ring-2 focus:ring-white/10 focus:border-white/40 outline-none"
                placeholder="Describe el servicio de manera clara y concisa..."
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-amber-400">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="detailedDescription" className="text-sm font-medium">
                Descripción Detallada (opcional)
              </Label>
              <Controller
                name="detailedDescription"
                control={control}
                render={({ field }) => (
                  <ParagraphEditor
                    id="detailedDescription"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Información ampliada que se muestra en la página del servicio. Usa 'Nuevo párrafo' para separar ideas en bloques legibles..."
                    maxLength={5000}
                  />
                )}
              />
              {errors.detailedDescription && (
                <p className="text-xs text-amber-400">{errors.detailedDescription.message}</p>
              )}
            </div>

            {/* Features */}
            <div className="border-t border-white/10 pt-6">
              <StringListField
                label="Características"
                items={features}
                onChange={setFeatures}
                placeholder="Ej: 8 horas de cobertura"
                disabled={isPending}
              />
            </div>

            <DisplayModeToggle
              useCarousel={useCarousel}
              onChange={setUseCarousel}
              disabled={isPending}
              carouselEligible={false}
              ineligibleHint="Podrás activar el carrusel después de crear el servicio y agregar al menos 2 imágenes a su galería."
            />

            {isSubmitted && errorList.length > 0 && (
              <div className="rounded-md border border-amber-400/20 bg-amber-400/5 p-3 -mt-4">
                <p className="mb-1.5 text-sm font-medium text-amber-400">Antes de guardar, corrige:</p>
                <ul className="space-y-1">
                  {errorList.map(err => (
                    <li key={err} className="flex items-start gap-1.5 text-xs text-amber-400/90">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 -mx-6 px-6 py-4 flex gap-3">
              <Button
                type="submit"
                disabled={isPending}
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
                onClick={handleCancelClick}
                className="h-11"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Se perderá la información que escribiste en este formulario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
