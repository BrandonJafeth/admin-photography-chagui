'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@/lib/toast'
import { Package } from '@/services/packages.service'
import { useCreatePackage, useUpdatePackage, usePackages } from '@/hooks/usePackages'
import { useServices } from '@/hooks/useServices'
import { packageFormSchema, type PackageFormValues } from '@/lib/validations/packages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StringListField } from '@/components/ui/StringListField'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Loader2 } from 'lucide-react'

interface PackageSheetProps {
  pkg: Package | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const UNIVERSAL_VALUE = 'universal'

export function PackageSheet({ pkg, isOpen, onOpenChange }: PackageSheetProps) {
  const { data: services = [] } = useServices()
  const { data: packages = [] } = usePackages()
  const createPackage = useCreatePackage()
  const updatePackage = useUpdatePackage()

  const initialServiceId = pkg?.service_id || UNIVERSAL_VALUE
  const initialIncludes = pkg?.includes || []
  const initialIsFeatured = pkg?.is_featured ?? false

  const [serviceId, setServiceId] = useState(initialServiceId)
  const [includes, setIncludes] = useState<string[]>(initialIncludes)
  const [isFeatured, setIsFeatured] = useState(initialIsFeatured)
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty: isFormDirty, isSubmitted },
  } = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: pkg?.name || '',
      description: pkg?.description || '',
    },
    mode: 'onBlur',
  })

  const isPending = createPackage.isPending || updatePackage.isPending || isSubmitting

  const isDirty = () =>
    isFormDirty ||
    serviceId !== initialServiceId ||
    JSON.stringify(includes) !== JSON.stringify(initialIncludes) ||
    isFeatured !== initialIsFeatured

  const handleClose = () => {
    if (isDirty()) {
      setConfirmDiscardOpen(true)
      return
    }
    onOpenChange(false)
  }

  const confirmDiscard = () => {
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

  const onSubmit = async (values: PackageFormValues) => {
    const payload = {
      service_id: serviceId === UNIVERSAL_VALUE ? null : serviceId,
      name: values.name,
      description: values.description || undefined,
      includes: includes.filter(i => i.trim().length > 0),
    }

    try {
      if (pkg) {
        await updatePackage.mutateAsync({ id: pkg.id, payload })
        toast.success('Paquete actualizado', {
          description: `"${values.name}" se actualizó correctamente`,
        })
      } else {
        const nextOrder = packages.length > 0 ? Math.max(...packages.map(p => p.order)) + 1 : 0
        await createPackage.mutateAsync({ ...payload, order: nextOrder, is_featured: isFeatured })
        toast.success('Paquete creado', {
          description: `"${values.name}" se creó correctamente`,
        })
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar paquete:', error)
      toast.error(pkg ? 'Error al actualizar' : 'Error al crear', {
        description: error instanceof Error ? error.message : 'Intenta nuevamente.',
      })
    }
  }

  const errorList = Object.values(errors)
    .map(e => e?.message)
    .filter((msg): msg is string => !!msg)

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
            <SheetHeader className="px-6 py-4">
              <SheetTitle className="text-xl">{pkg ? 'Editar Paquete' : 'Nuevo Paquete'}</SheetTitle>
              <SheetDescription>
                {pkg ? 'Actualiza los detalles del paquete' : 'Crea un nuevo paquete de servicios'} ·{' '}
                <span className="text-white/30">* campos requeridos</span>
              </SheetDescription>
            </SheetHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nombre *</Label>
              <Input
                id="name"
                placeholder="Ej: Paquete Premium Bodas"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-amber-400">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Servicio</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNIVERSAL_VALUE}>Universal — aplica a todos</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Descripción</Label>
              <textarea
                id="description"
                aria-label="Descripción"
                className="w-full min-h-[80px] px-3 py-2.5 bg-[#0d0d0d] border border-white/15 rounded-md resize-y text-sm leading-relaxed text-white focus:ring-2 focus:ring-white/10 focus:border-white/40 outline-none"
                placeholder="Breve descripción del paquete..."
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-amber-400">{errors.description.message}</p>
              )}
            </div>

            <StringListField
              label="Incluye"
              items={includes}
              onChange={setIncludes}
              placeholder="Ej: 300 fotos editadas"
              disabled={isPending}
            />

            <div className="flex items-center justify-between border-t border-white/10 pt-6">
              <div>
                <Label className="text-sm font-medium">Paquete Destacado</Label>
                <p className="text-xs text-white/40">Se muestra resaltado en el sitio público</p>
              </div>
              <Button
                type="button"
                variant={isFeatured ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsFeatured(v => !v)}
              >
                {isFeatured ? 'Destacado' : 'Normal'}
              </Button>
            </div>

            {isSubmitted && errorList.length > 0 && (
              <div className="text-sm text-amber-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full" />
                {errorList[0]}
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
                    Guardando...
                  </span>
                ) : pkg ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Paquete'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleClose} className="h-11">
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
