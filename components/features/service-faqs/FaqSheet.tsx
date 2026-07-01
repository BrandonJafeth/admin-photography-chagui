'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { ServiceFaq } from '@/services/service-faqs.service'
import { useCreateServiceFaq, useUpdateServiceFaq, useServiceFaqs } from '@/hooks/useServiceFaqs'
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
import { Loader2 } from 'lucide-react'

interface FaqSheetProps {
  serviceId: string
  faq: ServiceFaq | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function FaqSheet({ serviceId, faq, isOpen, onOpenChange }: FaqSheetProps) {
  const { data: faqs = [] } = useServiceFaqs(serviceId)
  const createFaq = useCreateServiceFaq()
  const updateFaq = useUpdateServiceFaq(serviceId)

  const [question, setQuestion] = useState(faq?.question || '')
  const [answer, setAnswer] = useState(faq?.answer || '')

  const isPending = createFaq.isPending || updateFaq.isPending
  const hasValidationErrors = () => !question.trim() || !answer.trim()

  const handleSubmit = async () => {
    if (hasValidationErrors()) return

    try {
      if (faq) {
        await updateFaq.mutateAsync({ id: faq.id, payload: { question, answer } })
        toast.success('Pregunta actualizada', {
          description: 'Los cambios se guardaron correctamente',
        })
      } else {
        const nextOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.order)) + 1 : 0
        await createFaq.mutateAsync({ service_id: serviceId, question, answer, order: nextOrder })
        toast.success('Pregunta creada', {
          description: 'La pregunta se agregó correctamente',
        })
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar FAQ:', error)
      toast.error(faq ? 'Error al actualizar' : 'Error al crear', {
        description: error instanceof Error ? error.message : 'Intenta nuevamente.',
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-white/10">
          <SheetHeader className="px-6 py-4">
            <SheetTitle className="text-xl">{faq ? 'Editar Pregunta' : 'Nueva Pregunta'}</SheetTitle>
            <SheetDescription>
              {faq ? 'Actualiza la pregunta frecuente' : 'Agrega una pregunta frecuente para este servicio'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question" className="text-sm font-medium">Pregunta *</Label>
            <Input
              id="question"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ej: ¿Cuánto tiempo dura la sesión?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer" className="text-sm font-medium">Respuesta *</Label>
            <textarea
              id="answer"
              aria-label="Respuesta"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              className="w-full min-h-[140px] px-3 py-2.5 bg-[#0d0d0d] border border-white/15 rounded-md resize-y text-sm leading-relaxed text-white focus:ring-2 focus:ring-white/10 focus:border-white/40 outline-none"
              placeholder="Escribe la respuesta..."
            />
          </div>

          {hasValidationErrors() && (
            <div className="text-sm text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
              Completa la pregunta y la respuesta
            </div>
          )}

          <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-white/10 -mx-6 px-6 py-4 flex gap-3">
            <Button onClick={handleSubmit} disabled={isPending || hasValidationErrors()} className="flex-1 h-11">
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </span>
              ) : faq ? (
                'Guardar Cambios'
              ) : (
                'Crear Pregunta'
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
