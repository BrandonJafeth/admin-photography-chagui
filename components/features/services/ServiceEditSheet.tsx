'use client'

import { useReducer, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Service } from '@/services/services.service'
import { useUpdateService } from '@/hooks/useServices'
import { useServiceGallery } from '@/hooks/useServiceGallery'
import { serviceFormSchema, type ServiceFormValues } from '@/lib/validations/services'
import { getImageValidationError, uploadToCloudinary } from '@/lib/cloudinary'
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
import { Upload, Loader2, MessageCircleQuestion, Images } from 'lucide-react'
import { toast } from '@/lib/toast'

interface ServiceEditSheetProps {
  service: Service
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
}

type UploadState = {
  isUploading: boolean
  uploadError: string | null
}

type UploadAction =
  | { type: 'uploadStarted' }
  | { type: 'uploadFailed'; error: string }
  | { type: 'uploadFinished' }

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'uploadStarted':
      return { isUploading: true, uploadError: null }
    case 'uploadFailed':
      return { isUploading: false, uploadError: action.error }
    case 'uploadFinished':
      return { ...state, isUploading: false }
  }
}

interface ImagePreviewUploadProps {
  service: Service
  isUploading: boolean
  uploadError: string | null
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function ImagePreviewUpload({
  service,
  isUploading,
  uploadError,
  onFileSelected,
}: ImagePreviewUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Vista Previa</Label>
        <div className="relative aspect-video overflow-hidden rounded-lg border-2 border-white/10 bg-white/5">
          {service.image ? (
            <Image
              src={service.image}
              alt={service.title}
              fill
              sizes="(min-width: 640px) 42rem, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <span className="text-white/40">Sin imagen</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-6">
        <Label className="text-sm font-medium">Cambiar Imagen</Label>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            aria-label="Seleccionar imagen"
            onChange={onFileSelected}
            disabled={isUploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Seleccionar Imagen
              </>
            )}
          </Button>
        </div>
        {uploadError && (
          <p className="text-xs text-red-400">{uploadError}</p>
        )}
        <p className="text-xs text-white/40">
          Formatos: JPEG, PNG, WebP, GIF • Máximo: 5MB
        </p>
      </div>
    </>
  )
}

interface ServiceMetadataProps {
  service: Service
}

function ServiceMetadata({ service }: ServiceMetadataProps) {
  return (
    <div className="space-y-1 border-t border-white/10 pt-6 text-xs text-white/40">
      <p>Creado: {new Date(service.created_at).toLocaleDateString()}</p>
      <p>Actualizado: {new Date(service.updated_at).toLocaleDateString()}</p>
      <p>Estado: {service.is_active ? 'Visible' : 'Oculto'}</p>
    </div>
  )
}

export function ServiceEditSheet({
  service,
  isOpen,
  onOpenChange,
  onClose,
}: ServiceEditSheetProps) {
  const defaultValues: ServiceFormValues = {
    title: service.title,
    description: service.description,
    detailedDescription: service.detailed_description || '',
  }

  const [features, setFeatures] = useState<string[]>(service.features || [])
  const [useCarousel, setUseCarousel] = useState(service.use_carousel)
  const { data: galleryImages } = useServiceGallery(service.id)
  const canUseCarousel = (galleryImages?.length ?? 0) >= 2
  const [upload, dispatchUpload] = useReducer(uploadReducer, {
    isUploading: false,
    uploadError: null,
  })
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateService = useUpdateService()

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
  const isPending = updateService.isPending || isSubmitting

  const isDirty = () =>
    isFormDirty ||
    JSON.stringify(features) !== JSON.stringify(service.features || []) ||
    useCarousel !== service.use_carousel

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = getImageValidationError(file)
    if (validationError) {
      dispatchUpload({ type: 'uploadFailed', error: validationError })
      return
    }

    dispatchUpload({ type: 'uploadStarted' })

    try {
      const result = await uploadToCloudinary(file, 'photographic-images/services')

      await updateService.mutateAsync({
        id: service.id,
        payload: {
          image: result.url,
        },
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      dispatchUpload({ type: 'uploadFinished' })
    } catch (error) {
      dispatchUpload({
        type: 'uploadFailed',
        error: error instanceof Error ? error.message : 'Error al subir la imagen',
      })
    }
  }

  const onSubmit = async (values: ServiceFormValues) => {
    try {
      await updateService.mutateAsync({
        id: service.id,
        payload: {
          title: values.title,
          description: values.description,
          detailed_description: values.detailedDescription || undefined,
          features: features.filter(f => f.trim().length > 0),
          use_carousel: useCarousel,
        },
      })
      toast.success('¡Servicio actualizado!', {
        description: 'Los cambios se guardaron correctamente',
      })
      onClose()
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error al guardar', {
        description: 'No se pudieron guardar los cambios. Intenta nuevamente.',
      })
    }
  }

  const revertChanges = () => {
    resetForm(defaultValues)
    setFeatures(service.features || [])
    setUseCarousel(service.use_carousel)
  }

  const handleCancel = () => {
    if (isDirty()) {
      setConfirmDiscardOpen(true)
      return
    }
    onClose()
  }

  const confirmDiscard = () => {
    revertChanges()
    setConfirmDiscardOpen(false)
    onClose()
  }

  const handleSheetOpenChange = (open: boolean) => {
    if (!open && isDirty()) {
      setConfirmDiscardOpen(true)
      return
    }
    onOpenChange(open)
  }

  const errorList = Object.values(errors)
    .map(e => e?.message)
    .filter((msg): msg is string => !!msg)

  const onFormSubmit = handleSubmit(onSubmit)

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
            <SheetHeader className="px-6 py-4">
              <SheetTitle className="text-xl">Editar Servicio</SheetTitle>
              <SheetDescription>
                Actualiza los detalles del servicio · <span className="text-white/30">* campos requeridos</span>
              </SheetDescription>
            </SheetHeader>
          </div>

          <form onSubmit={onFormSubmit} className="px-6 py-6 space-y-8">
            <ImagePreviewUpload
              service={service}
              isUploading={upload.isUploading}
              uploadError={upload.uploadError}
              onFileSelected={handleImageUpload}
            />

            <div className="space-y-2 border-t border-white/10 pt-6">
              <Label htmlFor="title" className="text-sm font-medium">
                Título <span className="text-red-400">*</span>
              </Label>
              <Input id="title" placeholder="Ej: BODAS" {...register('title')} />
              {errors.title && (
                <p className="text-xs text-amber-400">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descripción <span className="text-red-400">*</span> ({descriptionValue?.length ?? 0}/2000)
              </Label>
              <textarea
                id="description"
                aria-label="Descripción"
                className="w-full min-h-[100px] px-3 py-2.5 bg-[#0d0d0d] border border-white/15 rounded-md resize-y text-sm leading-relaxed text-white focus:ring-2 focus:ring-white/10 focus:border-white/40 outline-none"
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

            {/* FAQs */}
            <div className="border-t border-white/10 pt-6">
              <Link href={`/servicios/${service.id}/faqs`} onClick={onClose}>
                <Button type="button" variant="outline" className="w-full gap-2">
                  <MessageCircleQuestion className="w-4 h-4" />
                  Gestionar Preguntas Frecuentes
                </Button>
              </Link>
            </div>

            {/* Galería */}
            <div className="border-t border-white/10 pt-6">
              <Link href={`/servicios/${service.id}/galeria`} onClick={onClose}>
                <Button type="button" variant="outline" className="w-full gap-2">
                  <Images className="w-4 h-4" />
                  Gestionar Galería
                </Button>
              </Link>
            </div>

            <DisplayModeToggle
              useCarousel={useCarousel}
              onChange={setUseCarousel}
              disabled={isPending}
              carouselEligible={canUseCarousel}
            />

            <ServiceMetadata service={service} />

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

            {/* Actions */}
            <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 -mx-6 px-6 py-4 flex gap-3">
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 h-11"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
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
              Se perderán los cambios que hiciste en este formulario.
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
