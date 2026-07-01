'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import { useServiceById } from '@/hooks/useServices'
import {
  useServiceFaqs,
  useDeleteServiceFaq,
  useUpdateServiceFaq,
  useUpdateServiceFaqsOrder,
} from '@/hooks/useServiceFaqs'
import { ServiceFaq } from '@/services/service-faqs.service'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { ArrowLeft, ArrowDown, ArrowUp, Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { FaqSheet } from './FaqSheet'

interface ServiceFaqsManagerProps {
  serviceId: string
}

export default function ServiceFaqsManager({ serviceId }: ServiceFaqsManagerProps) {
  const { data: service, isLoading: isLoadingService } = useServiceById(serviceId)
  const { data: faqs = [], isLoading: isLoadingFaqs } = useServiceFaqs(serviceId)
  const deleteFaq = useDeleteServiceFaq(serviceId)
  const updateFaq = useUpdateServiceFaq(serviceId)
  const updateOrder = useUpdateServiceFaqsOrder(serviceId)

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<ServiceFaq | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [faqToDelete, setFaqToDelete] = useState<{ id: string; question: string } | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingFaq(null)
    setIsSheetOpen(true)
  }

  const handleEdit = (faq: ServiceFaq) => {
    setEditingFaq(faq)
    setIsSheetOpen(true)
  }

  const handleDelete = (id: string, question: string) => {
    setFaqToDelete({ id, question })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!faqToDelete) return
    try {
      await deleteFaq.mutateAsync(faqToDelete.id)
      toast.success('Pregunta eliminada', {
        description: `"${faqToDelete.question}" se eliminó correctamente`,
      })
    } catch (error) {
      toast.error('Error al eliminar', {
        description: 'No se pudo eliminar la pregunta. Intenta nuevamente.',
      })
    } finally {
      setDeleteDialogOpen(false)
      setFaqToDelete(null)
    }
  }

  const handleToggleActive = async (faq: ServiceFaq) => {
    setTogglingId(faq.id)
    try {
      await updateFaq.mutateAsync({ id: faq.id, payload: { is_active: !faq.is_active } })
      toast.success(faq.is_active ? 'Pregunta ocultada' : 'Pregunta visible', {
        description: faq.is_active
          ? 'Ya no aparecerá en el sitio público'
          : 'Ahora es visible en el sitio público',
      })
    } catch (error) {
      toast.error('Error al cambiar visibilidad', {
        description: 'No se pudo actualizar la visibilidad. Intenta nuevamente.',
      })
    } finally {
      setTogglingId(null)
    }
  }

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= faqs.length) return

    const reordered = [...faqs]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    const updates = reordered.map((faq, i) => ({ id: faq.id, order: i }))

    try {
      await updateOrder.mutateAsync(updates)
    } catch (error) {
      toast.error('Error al reordenar', {
        description: 'No se pudo actualizar el orden. Intenta nuevamente.',
      })
    }
  }

  if (isLoadingService || isLoadingFaqs) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-y-auto bg-[#0d0d0d]">
        <div className="p-4 md:p-6">
          <div className="max-w-[1400px] mx-auto min-w-0">
            <Link href="/servicios">
              <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2">
                <ArrowLeft className="w-4 h-4" />
                Volver a Servicios
              </Button>
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-[#1a1a1a] p-4 md:p-6 rounded-lg shadow-sm border border-white/10">
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-white mb-2 wrap-break-word">
                  Preguntas Frecuentes {service ? `— ${service.title}` : ''}
                </h1>
                <p className="text-sm text-white/60">Gestiona las preguntas frecuentes de este servicio</p>
              </div>
              <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto shrink-0">
                <Plus className="w-4 h-4" />
                Agregar Pregunta
              </Button>
            </div>

            {faqs.length === 0 ? (
              <div className="bg-[#1a1a1a] rounded-lg shadow-sm border border-white/10 h-32 flex items-center justify-center text-center text-white/50 px-4">
                No hay preguntas frecuentes. Agrega una para comenzar.
              </div>
            ) : (
              <>
                {/* Mobile: lista de tarjetas */}
                <div className="md:hidden space-y-3">
                  {faqs.map((faq, index) => (
                    <div
                      key={faq.id}
                      className="bg-[#1a1a1a] rounded-lg shadow-sm border border-white/10 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={index === 0}
                            onClick={() => handleMove(index, -1)}
                            title="Mover pregunta hacia arriba"
                            aria-label="Mover pregunta hacia arriba"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={index === faqs.length - 1}
                            onClick={() => handleMove(index, 1)}
                            title="Mover pregunta hacia abajo"
                            aria-label="Mover pregunta hacia abajo"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(faq)}
                            disabled={togglingId === faq.id}
                            className="gap-1.5 px-2"
                            title={faq.is_active ? 'Ocultar pregunta del sitio público' : 'Mostrar pregunta en el sitio público'}
                            aria-label={faq.is_active ? 'Ocultar pregunta del sitio público' : 'Mostrar pregunta en el sitio público'}
                          >
                            {togglingId === faq.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : faq.is_active ? (
                              <Eye className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-white/40" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(faq)}
                            title="Editar esta pregunta"
                            aria-label="Editar esta pregunta"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300"
                            onClick={() => handleDelete(faq.id, faq.question)}
                            title="Eliminar esta pregunta"
                            aria-label="Eliminar esta pregunta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium text-white wrap-break-word">{faq.question}</p>
                        <p className="text-sm text-white/60 wrap-break-word line-clamp-3">{faq.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: tabla */}
                <div className="hidden md:block bg-[#1a1a1a] rounded-lg shadow-sm border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Orden</TableHead>
                        <TableHead>Pregunta</TableHead>
                        <TableHead>Respuesta</TableHead>
                        <TableHead>Activo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faqs.map((faq, index) => (
                        <TableRow key={faq.id}>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                disabled={index === 0}
                                onClick={() => handleMove(index, -1)}
                                title="Mover pregunta hacia arriba"
                                aria-label="Mover pregunta hacia arriba"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                disabled={index === faqs.length - 1}
                                onClick={() => handleMove(index, 1)}
                                title="Mover pregunta hacia abajo"
                                aria-label="Mover pregunta hacia abajo"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-white max-w-xs truncate">{faq.question}</TableCell>
                          <TableCell className="text-white/60 max-w-sm truncate">{faq.answer}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleActive(faq)}
                              disabled={togglingId === faq.id}
                              className="gap-1.5 px-2"
                              title={faq.is_active ? 'Ocultar pregunta del sitio público' : 'Mostrar pregunta en el sitio público'}
                              aria-label={faq.is_active ? 'Ocultar pregunta del sitio público' : 'Mostrar pregunta en el sitio público'}
                            >
                              {togglingId === faq.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : faq.is_active ? (
                                <Eye className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-white/40" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(faq)}
                                title="Editar esta pregunta"
                                aria-label="Editar esta pregunta"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:text-red-300"
                                onClick={() => handleDelete(faq.id, faq.question)}
                                title="Eliminar esta pregunta"
                                aria-label="Eliminar esta pregunta"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <FaqSheet serviceId={serviceId} faq={editingFaq} isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pregunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar "{faqToDelete?.question}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
