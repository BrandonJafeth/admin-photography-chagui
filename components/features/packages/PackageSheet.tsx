'use client'

import { useReducer, useState } from 'react'
import { toast } from '@/lib/toast'
import { Package } from '@/services/packages.service'
import { useCreatePackage, useUpdatePackage, usePackages } from '@/hooks/usePackages'
import { useServices } from '@/hooks/useServices'
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

type PackageFormState = {
  serviceId: string
  name: string
  description: string
  includes: string[]
  isFeatured: boolean
}

type PackageFormAction =
  | { type: 'fieldChanged'; name: 'serviceId' | 'name' | 'description'; value: string }
  | { type: 'fieldChanged'; name: 'includes'; value: string[] }
  | { type: 'fieldChanged'; name: 'isFeatured'; value: boolean }

function packageFormReducer(state: PackageFormState, action: PackageFormAction): PackageFormState {
  switch (action.type) {
    case 'fieldChanged':
      return { ...state, [action.name]: action.value }
  }
}

export function PackageSheet({ pkg, isOpen, onOpenChange }: PackageSheetProps) {
  const { data: services = [] } = useServices()
  const { data: packages = [] } = usePackages()
  const createPackage = useCreatePackage()
  const updatePackage = useUpdatePackage()

  const initialFormState: PackageFormState = {
    serviceId: pkg?.service_id || UNIVERSAL_VALUE,
    name: pkg?.name || '',
    description: pkg?.description || '',
    includes: pkg?.includes || [],
    isFeatured: pkg?.is_featured ?? false,
  }
  const [formState, dispatch] = useReducer(packageFormReducer, initialFormState)
  const { serviceId, name, description, includes, isFeatured } = formState

  const [nameTouched, setNameTouched] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false)

  const isPending = createPackage.isPending || updatePackage.isPending

  const getValidationErrors = () => {
    const errors: string[] = []
    if (!name || name.length < 3 || name.length > 200) {
      errors.push('El nombre debe tener entre 3 y 200 caracteres')
    }
    return errors
  }

  const isDirty = () => JSON.stringify(formState) !== JSON.stringify(initialFormState)

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

  const handleSubmit = async () => {
    const errors = getValidationErrors()
    if (errors.length > 0) {
      setSubmitAttempted(true)
      return
    }

    const payload = {
      service_id: serviceId === UNIVERSAL_VALUE ? null : serviceId,
      name,
      description: description || undefined,
      includes: includes.filter(i => i.trim().length > 0),
    }

    try {
      if (pkg) {
        await updatePackage.mutateAsync({ id: pkg.id, payload })
        toast.success('Paquete actualizado', {
          description: `"${name}" se actualizó correctamente`,
        })
      } else {
        const nextOrder = packages.length > 0 ? Math.max(...packages.map(p => p.order)) + 1 : 0
        await createPackage.mutateAsync({ ...payload, order: nextOrder, is_featured: isFeatured })
        toast.success('Paquete creado', {
          description: `"${name}" se creó correctamente`,
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

  const validationErrors = getValidationErrors()
  const showNameError = nameTouched || submitAttempted

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

        <div className="px-6 py-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={e => dispatch({ type: 'fieldChanged', name: 'name', value: e.target.value })}
              onBlur={() => setNameTouched(true)}
              placeholder="Ej: Paquete Premium Bodas"
            />
            {showNameError && name && name.length < 3 && (
              <p className="text-xs text-amber-400">El nombre debe tener al menos 3 caracteres</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Servicio</Label>
            <Select value={serviceId} onValueChange={value => dispatch({ type: 'fieldChanged', name: 'serviceId', value })}>
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
              value={description}
              onChange={e => dispatch({ type: 'fieldChanged', name: 'description', value: e.target.value })}
              className="w-full min-h-[80px] px-3 py-2.5 bg-[#0d0d0d] border border-white/15 rounded-md resize-y text-sm leading-relaxed text-white focus:ring-2 focus:ring-white/10 focus:border-white/40 outline-none"
              placeholder="Breve descripción del paquete..."
            />
          </div>

          <StringListField
            label="Incluye"
            items={includes}
            onChange={value => dispatch({ type: 'fieldChanged', name: 'includes', value })}
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
              onClick={() => dispatch({ type: 'fieldChanged', name: 'isFeatured', value: !isFeatured })}
            >
              {isFeatured ? 'Destacado' : 'Normal'}
            </Button>
          </div>

          {submitAttempted && validationErrors.length > 0 && (
            <div className="text-sm text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
              {validationErrors[0]}
            </div>
          )}

          <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 -mx-6 px-6 py-4 flex gap-3">
            <Button
              onClick={handleSubmit}
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
        </div>
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
