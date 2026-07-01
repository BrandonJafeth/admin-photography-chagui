'use client'

import { useReducer, useState } from 'react'
import Image from 'next/image'
import { Service } from '@/services/services.service'
import { useDeleteService, useUpdateService, useUpdateServicesOrder } from '@/hooks/useServices'
import { Button } from '@/components/ui/button'
import { Trash2, Eye, EyeOff, GripVertical, Pencil, Loader2 } from 'lucide-react'
import { ServiceEditSheet } from './ServiceEditSheet'
import { toast } from '@/lib/toast'
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


interface ServicesGridProps {
  services: Service[]
  isReordering: boolean
}

type DragState = { draggedId: string | null; dragPosition: { x: number; y: number } }
type DragAction =
  | { type: 'dragStarted'; id: string; x: number; y: number }
  | { type: 'dragMoved'; x: number; y: number }
  | { type: 'dragEnded' }

function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case 'dragStarted':
      return { draggedId: action.id, dragPosition: { x: action.x, y: action.y } }
    case 'dragMoved':
      return { ...state, dragPosition: { x: action.x, y: action.y } }
    case 'dragEnded':
      return { ...state, draggedId: null }
  }
}

type EditSheetState = { editingId: string | null; isSheetOpen: boolean }
type EditSheetAction =
  | { type: 'editRequested'; id: string }
  | { type: 'openChanged'; open: boolean }
  | { type: 'closed' }

function editSheetReducer(state: EditSheetState, action: EditSheetAction): EditSheetState {
  switch (action.type) {
    case 'editRequested':
      return { editingId: action.id, isSheetOpen: true }
    case 'openChanged':
      return { ...state, isSheetOpen: action.open }
    case 'closed':
      return { editingId: null, isSheetOpen: false }
  }
}

type DeleteDialogState = { deleteDialogOpen: boolean; serviceToDelete: { id: string; title: string } | null }
type DeleteDialogAction =
  | { type: 'deleteRequested'; id: string; title: string }
  | { type: 'openChanged'; open: boolean }
  | { type: 'resolved' }

function deleteDialogReducer(state: DeleteDialogState, action: DeleteDialogAction): DeleteDialogState {
  switch (action.type) {
    case 'deleteRequested':
      return { deleteDialogOpen: true, serviceToDelete: { id: action.id, title: action.title } }
    case 'openChanged':
      return { ...state, deleteDialogOpen: action.open }
    case 'resolved':
      return { deleteDialogOpen: false, serviceToDelete: null }
  }
}

interface DraggedServicePreviewProps {
  service: Service
  position: { x: number; y: number }
}

function DraggedServicePreview({ service, position }: DraggedServicePreviewProps) {
  return (
    <div
      className="fixed pointer-events-none z-[9999] opacity-90"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
        width: '300px',
      }}
    >
      <div className="rounded-xl overflow-hidden bg-[#1a1a1a] border-2 border-white/30 shadow-2xl">
        <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
          {service.image ? (
            <Image
              src={service.image}
              alt={service.title}
              fill
              sizes="300px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <span className="text-white/40 text-sm">Sin imagen</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-bold text-white truncate">{service.title}</h3>
          <p className="text-xs text-white/50 truncate">/{service.slug}</p>
        </div>
      </div>
    </div>
  )
}

interface ServiceCardProps {
  service: Service
  index: number
  isReordering: boolean
  isDragged: boolean
  isToggling: boolean
  onDragStart: (id: string, e: React.DragEvent) => void
  onDrag: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (id: string) => void
  onDragEnd: () => void
  onToggleVisibility: (id: string, isVisible: boolean) => void
  onEdit: (id: string) => void
  onDelete: (id: string, title: string) => void
}

function ServiceCard({
  service,
  index,
  isReordering,
  isDragged,
  isToggling,
  onDragStart,
  onDrag,
  onDragOver,
  onDrop,
  onDragEnd,
  onToggleVisibility,
  onEdit,
  onDelete,
}: ServiceCardProps) {
  return (
    <div
      draggable={isReordering}
      onDragStart={(e) => onDragStart(service.id, e)}
      onDrag={onDrag}
      onDragOver={onDragOver}
      onDrop={() => onDrop(service.id)}
      onDragEnd={onDragEnd}
      className={`relative group rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/10 shadow-md hover:shadow-xl transition-all ${isReordering ? 'cursor-move' : 'cursor-default'} ${isDragged
        ? 'ring-4 ring-white/40 shadow-2xl scale-105'
        : 'hover:scale-[1.02]'
        }`}
    >
      {/* Imagen */}
      <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
        {service.image ? (
          <Image
            src={service.image}
            alt={service.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority={index < 3}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <span className="text-white/40 text-sm">Sin imagen</span>
          </div>
        )}

        {!isReordering && (
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${service.is_active
              ? 'bg-green-500 text-white'
              : 'bg-white/20 text-white'
              }`}>
              {service.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        )}

        {isReordering && (
          <div className="absolute top-2 left-2 bg-white text-black p-2 rounded cursor-move shadow-lg">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white mb-1">{service.title}</h3>
            <p className="text-xs text-white/50 font-medium">/{service.slug}</p>
          </div>
          {isReordering && (
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-white bg-white/10 px-2 py-1 rounded">
                #{index + 1}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-white/60 line-clamp-2 min-h-[2.5rem]">
          {service.description}
        </p>

        {!isReordering && (
          <div className="flex gap-2 pt-3 border-t border-white/10">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleVisibility(service.id, service.is_active)}
              className="flex-1 gap-1.5 text-xs"
              title={service.is_active ? 'Ocultar servicio del sitio público' : 'Mostrar servicio en el sitio público'}
              aria-label={service.is_active ? 'Ocultar servicio del sitio público' : 'Mostrar servicio en el sitio público'}
              disabled={isToggling}
            >
              {isToggling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : service.is_active ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              {isToggling ? '...' : service.is_active ? 'Ocultar' : 'Mostrar'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(service.id)}
              className="flex-1 gap-1.5 text-xs"
              title="Editar este servicio"
              aria-label="Editar este servicio"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(service.id, service.title)}
              className="gap-1.5 text-xs"
              title="Eliminar este servicio"
              aria-label="Eliminar este servicio"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}

interface DeleteServiceDialogProps {
  open: boolean
  serviceTitle: string | undefined
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

function DeleteServiceDialog({ open, serviceTitle, onOpenChange, onConfirm }: DeleteServiceDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar "{serviceTitle}". Esta acción no se puede deshacer y también eliminará sus preguntas frecuentes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ServicesGrid({ services, isReordering }: ServicesGridProps) {
  const [dragState, dispatchDrag] = useReducer(dragReducer, { draggedId: null, dragPosition: { x: 0, y: 0 } })
  const [editSheetState, dispatchEditSheet] = useReducer(editSheetReducer, { editingId: null, isSheetOpen: false })
  const [deleteDialogState, dispatchDeleteDialog] = useReducer(deleteDialogReducer, { deleteDialogOpen: false, serviceToDelete: null })
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const deleteService = useDeleteService()
  const updateService = useUpdateService()
  const updateOrder = useUpdateServicesOrder()

  const { draggedId, dragPosition } = dragState
  const { editingId, isSheetOpen } = editSheetState
  const { deleteDialogOpen, serviceToDelete } = deleteDialogState

  const editingService = services.find(svc => svc.id === editingId)

  const handleDragStart = (id: string, e: React.DragEvent) => {
    if (!isReordering) return
    dispatchDrag({ type: 'dragStarted', id, x: e.clientX, y: e.clientY })

    const ghost = document.createElement('div')
    ghost.style.opacity = '0'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
  }

  const handleDrag = (e: React.DragEvent) => {
    if (!isReordering || e.clientX === 0 || e.clientY === 0) return
    dispatchDrag({ type: 'dragMoved', x: e.clientX, y: e.clientY })
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!isReordering) return
    e.preventDefault()
  }

  const handleDragEnd = () => {
    dispatchDrag({ type: 'dragEnded' })
  }

  const handleDrop = async (targetId: string) => {
    if (!isReordering || !draggedId || draggedId === targetId) {
      dispatchDrag({ type: 'dragEnded' })
      return
    }

    const draggedIndex = services.findIndex(svc => svc.id === draggedId)
    const targetIndex = services.findIndex(svc => svc.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      dispatchDrag({ type: 'dragEnded' })
      return
    }

    const newServices = [...services]
    const [draggedService] = newServices.splice(draggedIndex, 1)
    newServices.splice(targetIndex, 0, draggedService)

    const updates = newServices.map((svc, index) => ({
      id: svc.id,
      order: index,
    }))

    try {
      await updateOrder.mutateAsync(updates)
      toast.success('Orden actualizado', {
        description: 'El orden de los servicios se actualizó correctamente',
      })
    } catch (error) {
      console.error('Error al actualizar orden:', error)
      toast.error('Error al reordenar', {
        description: 'No se pudo actualizar el orden. Intenta nuevamente.',
      })
    }

    dispatchDrag({ type: 'dragEnded' })
  }

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    setTogglingId(id)
    try {
      await updateService.mutateAsync({
        id,
        payload: { is_active: !isVisible },
      })
      toast.success(isVisible ? 'Servicio ocultado' : 'Servicio visible', {
        description: `El servicio ahora está ${isVisible ? 'oculto' : 'visible'}`,
      })
    } catch (error) {
      console.error('Error al actualizar visibilidad:', error)
      toast.error('Error al cambiar visibilidad', {
        description: 'No se pudo actualizar la visibilidad. Intenta nuevamente.',
      })
    } finally {
      setTogglingId(null)
    }
  }

  const handleEdit = (id: string) => {
    dispatchEditSheet({ type: 'editRequested', id })
  }

  const handleDelete = (id: string, title: string) => {
    dispatchDeleteDialog({ type: 'deleteRequested', id, title })
  }

  const confirmDelete = async () => {
    if (!serviceToDelete) return

    const loadingToast = toast.loading('Eliminando servicio...', {
      description: 'Por favor espera',
    })

    try {
      await deleteService.mutateAsync(serviceToDelete.id)
      toast.dismiss(loadingToast)
      toast.success('Servicio eliminado', {
        description: 'El servicio se eliminó correctamente',
      })
    } catch (error) {
      console.error('Error al eliminar:', error)
      toast.dismiss(loadingToast)
      toast.error('Error al eliminar', {
        description: 'No se pudo eliminar el servicio. Intenta nuevamente.',
      })
    } finally {
      dispatchDeleteDialog({ type: 'resolved' })
    }
  }

  const draggedService = services.find(svc => svc.id === draggedId)

  return (
    <>
      {draggedId && draggedService && (
        <DraggedServicePreview service={draggedService} position={dragPosition} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, index) => (
          <ServiceCard
            key={service.id}
            service={service}
            index={index}
            isReordering={isReordering}
            isDragged={draggedId === service.id}
            isToggling={togglingId === service.id}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onToggleVisibility={handleToggleVisibility}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {editingService && (
        <ServiceEditSheet
          key={editingService.id}
          service={editingService}
          isOpen={isSheetOpen}
          onOpenChange={(open) => dispatchEditSheet({ type: 'openChanged', open })}
          onClose={() => dispatchEditSheet({ type: 'closed' })}
        />
      )}

      <DeleteServiceDialog
        open={deleteDialogOpen}
        serviceTitle={serviceToDelete?.title}
        onOpenChange={(open) => dispatchDeleteDialog({ type: 'openChanged', open })}
        onConfirm={confirmDelete}
      />
    </>
  )
}
