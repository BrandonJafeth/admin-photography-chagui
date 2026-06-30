'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Testimonial } from '@/services/testimonials.service'
import { useCreateTestimonial, useUpdateTestimonial, useTestimonials } from '@/hooks/useTestimonials'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StarRating } from '@/components/ui/StarRating'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Loader2 } from 'lucide-react'

interface TestimonialSheetProps {
  testimonial: Testimonial | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function TestimonialSheet({ testimonial, isOpen, onOpenChange }: TestimonialSheetProps) {
  const { data: testimonials = [] } = useTestimonials()
  const createTestimonial = useCreateTestimonial()
  const updateTestimonial = useUpdateTestimonial()

  const [clientName, setClientName] = useState('')
  const [position, setPosition] = useState('')
  const [text, setText] = useState('')
  const [rating, setRating] = useState(5)

  useEffect(() => {
    if (isOpen) {
      setClientName(testimonial?.client_name || '')
      setPosition(testimonial?.position || '')
      setText(testimonial?.text || '')
      setRating(testimonial?.rating ?? 5)
    }
  }, [isOpen, testimonial])

  const isPending = createTestimonial.isPending || updateTestimonial.isPending
  const hasValidationErrors = () => !clientName.trim() || !text.trim()

  const handleSubmit = async () => {
    if (hasValidationErrors()) return

    const payload = {
      client_name: clientName,
      position: position || undefined,
      text,
      rating,
    }

    try {
      if (testimonial) {
        await updateTestimonial.mutateAsync({ id: testimonial.id, payload })
        toast.success('Testimonio actualizado')
      } else {
        const nextOrder = testimonials.length > 0 ? Math.max(...testimonials.map(t => t.order)) + 1 : 0
        await createTestimonial.mutateAsync({ ...payload, order: nextOrder })
        toast.success('Testimonio creado')
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar testimonio:', error)
      toast.error(testimonial ? 'Error al actualizar' : 'Error al crear', {
        description: error instanceof Error ? error.message : 'Intenta nuevamente.',
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
          <SheetHeader className="px-6 py-4">
            <SheetTitle className="text-xl">{testimonial ? 'Editar Testimonio' : 'Nuevo Testimonio'}</SheetTitle>
            <SheetDescription>
              {testimonial ? 'Actualiza el testimonio del cliente' : 'Agrega un testimonio de un cliente'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-sm font-medium">Nombre del Cliente *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Ej: María Rodríguez"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position" className="text-sm font-medium">Cargo / Contexto (opcional)</Label>
            <Input
              id="position"
              value={position}
              onChange={e => setPosition(e.target.value)}
              placeholder="Ej: Novia, Boda en Heredia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text" className="text-sm font-medium">Testimonio *</Label>
            <textarea
              id="text"
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full min-h-[140px] px-3 py-2.5 bg-[#0d0d0d] border border-white/15 rounded-md resize-y text-sm leading-relaxed text-white focus:ring-2 focus:ring-white/10 focus:border-white/40 outline-none"
              placeholder="Escribe el testimonio del cliente..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Calificación</Label>
            <StarRating value={rating} onChange={setRating} size={28} />
          </div>

          {hasValidationErrors() && (
            <div className="text-sm text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
              Completa el nombre del cliente y el testimonio
            </div>
          )}

          <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 -mx-6 px-6 py-4 flex gap-3">
            <Button onClick={handleSubmit} disabled={isPending || hasValidationErrors()} className="flex-1 h-11">
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </span>
              ) : testimonial ? (
                'Guardar Cambios'
              ) : (
                'Crear Testimonio'
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
