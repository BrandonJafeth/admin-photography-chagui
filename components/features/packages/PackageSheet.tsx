'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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

  const [serviceId, setServiceId] = useState<string>(UNIVERSAL_VALUE)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [includes, setIncludes] = useState<string[]>([])
  const [isFeatured, setIsFeatured] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setServiceId(pkg?.service_id || UNIVERSAL_VALUE)
      setName(pkg?.name || '')
      setPrice(pkg ? String(pkg.price) : '')
      setDescription(pkg?.description || '')
      setIncludes(pkg?.includes || [])
      setIsFeatured(pkg?.is_featured ?? false)
    }
  }, [isOpen, pkg])

  const isPending = createPackage.isPending || updatePackage.isPending

  const hasValidationErrors = () => {
    if (!name || name.length < 3 || name.length > 200) return true
    const priceNum = Number(price)
    if (!price || isNaN(priceNum) || priceNum <= 0 || !Number.isInteger(priceNum)) return true
    return false
  }

  const handleSubmit = async () => {
    if (hasValidationErrors()) return

    const payload = {
      service_id: serviceId === UNIVERSAL_VALUE ? null : serviceId,
      name,
      price: Number(price),
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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
          <SheetHeader className="px-6 py-4">
            <SheetTitle className="text-xl">{pkg ? 'Editar Paquete' : 'Nuevo Paquete'}</SheetTitle>
            <SheetDescription>
              {pkg ? 'Actualiza los detalles del paquete' : 'Crea un nuevo paquete de servicios'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Paquete Premium Bodas"
            />
            {name && name.length < 3 && (
              <p className="text-xs text-amber-400">El nombre debe tener al menos 3 caracteres</p>
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
            <Label htmlFor="price" className="text-sm font-medium">Precio (₡) *</Label>
            <Input
              id="price"
              type="number"
              min={1}
              step={1}
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Ej: 150000"
            />
            <p className="text-xs text-white/40">Monto en colones costarricenses, sin decimales</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Descripción</Label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full min-h-[80px] px-3 py-2.5 bg-[#0d0d0d] border border-white/15 rounded-md resize-y text-sm leading-relaxed text-white focus:ring-2 focus:ring-white/10 focus:border-white/40 outline-none"
              placeholder="Breve descripción del paquete..."
            />
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
              onClick={() => setIsFeatured(!isFeatured)}
            >
              {isFeatured ? 'Destacado' : 'Normal'}
            </Button>
          </div>

          {hasValidationErrors() && (
            <div className="text-sm text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
              Completa el nombre y un precio válido
            </div>
          )}

          <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 -mx-6 px-6 py-4 flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={isPending || hasValidationErrors()}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11">
              Cancelar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
