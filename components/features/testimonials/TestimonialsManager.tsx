'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  useTestimonials,
  useDeleteTestimonial,
  useUpdateTestimonial,
} from '@/hooks/useTestimonials'
import { Testimonial } from '@/services/testimonials.service'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StarRating } from '@/components/ui/StarRating'
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
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { TestimonialSheet } from './TestimonialSheet'

export default function TestimonialsManager() {
  const { data: testimonials = [], isLoading } = useTestimonials()
  const deleteTestimonial = useDeleteTestimonial()
  const updateTestimonial = useUpdateTestimonial()

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testimonialToDelete, setTestimonialToDelete] = useState<{ id: string; name: string } | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingTestimonial(null)
    setIsSheetOpen(true)
  }

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial)
    setIsSheetOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    setTestimonialToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!testimonialToDelete) return
    try {
      await deleteTestimonial.mutateAsync(testimonialToDelete.id)
      toast.success('Testimonio eliminado')
    } catch (error) {
      toast.error('Error al eliminar')
    } finally {
      setDeleteDialogOpen(false)
      setTestimonialToDelete(null)
    }
  }

  const handleToggleVisible = async (testimonial: Testimonial) => {
    setTogglingId(testimonial.id)
    try {
      await updateTestimonial.mutateAsync({
        id: testimonial.id,
        payload: { is_visible: !testimonial.is_visible },
      })
    } catch (error) {
      toast.error('Error al cambiar visibilidad')
    } finally {
      setTogglingId(null)
    }
  }

  if (isLoading) {
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
        <div className="p-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-[#1a1a1a] p-4 md:p-6 rounded-lg shadow-sm border border-white/10">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">Testimonios</h1>
                <p className="text-sm text-white/60">Administra los testimonios de tus clientes</p>
              </div>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                Agregar Testimonio
              </Button>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg shadow-sm border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Testimonio</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Visible</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-white/50">
                        No hay testimonios. Agrega uno para comenzar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    testimonials.map(testimonial => (
                      <TableRow key={testimonial.id}>
                        <TableCell>
                          <div className="font-medium text-white">{testimonial.client_name}</div>
                          {testimonial.position && (
                            <div className="text-xs text-white/50">{testimonial.position}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-white/60 max-w-sm truncate">{testimonial.text}</TableCell>
                        <TableCell>
                          <StarRating value={testimonial.rating} readOnly size={16} />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleVisible(testimonial)}
                            disabled={togglingId === testimonial.id}
                            className="gap-1.5 px-2"
                          >
                            {togglingId === testimonial.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : testimonial.is_visible ? (
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
                              onClick={() => handleEdit(testimonial)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-300"
                              onClick={() => handleDelete(testimonial.id, testimonial.client_name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <TestimonialSheet
        testimonial={editingTestimonial}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar testimonio?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el testimonio de "{testimonialToDelete?.name}". Esta acción no se puede deshacer.
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
