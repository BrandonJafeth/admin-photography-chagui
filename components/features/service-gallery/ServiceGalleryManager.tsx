'use client'

import { useEffect, useReducer, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from '@/lib/toast'
import { useServiceById } from '@/hooks/useServices'
import {
  useServiceGallery,
  useDeleteServiceGalleryImage,
  useUpdateServiceGalleryOrder,
} from '@/hooks/useServiceGallery'
import { ServiceGalleryImage } from '@/services/service-gallery.service'
import { usePagination } from '@/hooks/usePagination'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { Skeleton } from '@/components/ui/skeleton'
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
import { ArrowLeft, GripVertical, Images, Plus, Pencil, Trash2 } from 'lucide-react'
import { GalleryImageSheet } from './GalleryImageSheet'

interface ServiceGalleryManagerProps {
  serviceId: string
}

type SheetState = { isOpen: boolean; editingImage: ServiceGalleryImage | null; newImageNonce: number }
type SheetAction =
  | { type: 'opened'; image: ServiceGalleryImage | null }
  | { type: 'openChanged'; open: boolean }

function sheetReducer(state: SheetState, action: SheetAction): SheetState {
  switch (action.type) {
    case 'opened':
      return {
        isOpen: true,
        editingImage: action.image,
        newImageNonce: action.image ? state.newImageNonce : state.newImageNonce + 1,
      }
    case 'openChanged':
      return { ...state, isOpen: action.open, editingImage: action.open ? state.editingImage : null }
  }
}

type DeleteDialogState = { isOpen: boolean; imageToDelete: ServiceGalleryImage | null }
type DeleteDialogAction =
  | { type: 'requested'; image: ServiceGalleryImage }
  | { type: 'openChanged'; open: boolean }
  | { type: 'resolved' }

function deleteDialogReducer(state: DeleteDialogState, action: DeleteDialogAction): DeleteDialogState {
  switch (action.type) {
    case 'requested':
      return { isOpen: true, imageToDelete: action.image }
    case 'openChanged':
      return { ...state, isOpen: action.open }
    case 'resolved':
      return { isOpen: false, imageToDelete: null }
  }
}

interface GalleryThumbnailProps {
  image: ServiceGalleryImage
  index: number
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
  onEdit: (image: ServiceGalleryImage) => void
  onDelete: (image: ServiceGalleryImage) => void
}

function GalleryThumbnail({ image, index, dragHandleProps, onEdit, onDelete }: GalleryThumbnailProps) {
  return (
    <>
      <span className="absolute top-2 left-2 z-10 font-mono text-[10px] tracking-widest text-white/50 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded transition-colors duration-300 group-hover:text-white/90">
        {String(index + 1).padStart(2, '0')}
      </span>

      <Image
        src={image.image_url}
        alt={image.caption || 'Imagen de galería'}
        fill
        unoptimized
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        className="object-cover grayscale-35 transition-all duration-700 ease-out group-hover:grayscale-0 group-hover:scale-[1.04]"
      />

      <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/70 to-transparent pointer-events-none" />

      {dragHandleProps && (
        <button
          type="button"
          {...dragHandleProps}
          className="absolute top-1.5 right-1.5 flex items-center justify-center h-7 w-7 rounded-md bg-black/50 backdrop-blur-sm text-white/70 hover:text-white cursor-grab active:cursor-grabbing touch-none"
          title="Arrastrar para reordenar"
          aria-label="Arrastrar para reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-black/50 backdrop-blur-sm hover:bg-black/70"
          onClick={() => onEdit(image)}
          title="Editar título"
          aria-label="Editar título"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-red-400 hover:text-red-300"
          onClick={() => onDelete(image)}
          title="Eliminar imagen"
          aria-label="Eliminar imagen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {image.caption && (
        <div className="absolute bottom-1.5 left-1.5 right-16 pointer-events-none">
          <p className="text-xs text-white/90 wrap-break-word line-clamp-1">{image.caption}</p>
        </div>
      )}
    </>
  )
}

interface SortableGalleryItemProps {
  image: ServiceGalleryImage
  index: number
  onEdit: (image: ServiceGalleryImage) => void
  onDelete: (image: ServiceGalleryImage) => void
}

function SortableGalleryItem({ image, index, onEdit, onDelete }: SortableGalleryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-shadow duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-black/40 ${isDragging ? 'opacity-30' : ''}`}
    >
      <GalleryThumbnail
        image={image}
        index={index}
        dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

interface GalleryGridProps {
  images: ServiceGalleryImage[]
  pageOffset: number
  onDragEnd: (event: DragEndEvent) => void
  onEdit: (image: ServiceGalleryImage) => void
  onDelete: (image: ServiceGalleryImage) => void
}

function GalleryGrid({ images, pageOffset, onDragEnd, onEdit, onDelete }: GalleryGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeImage = images.find(i => i.id === activeId) ?? null
  const activeIndex = activeImage ? pageOffset + images.indexOf(activeImage) : -1

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    onDragEnd(event)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <SortableGalleryItem key={image.id} image={image} index={pageOffset + index} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeImage && (
          <div className="relative aspect-square rounded-xl overflow-hidden border border-white/20 shadow-2xl shadow-black/60 rotate-2 scale-105">
            <GalleryThumbnail image={activeImage} index={activeIndex} onEdit={() => {}} onDelete={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

interface DeleteGalleryImageDialogProps {
  isOpen: boolean
  image: ServiceGalleryImage | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

function DeleteGalleryImageDialog({ isOpen, image, onOpenChange, onConfirm }: DeleteGalleryImageDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
          <AlertDialogDescription>
            {`Estás a punto de eliminar "${image?.caption || 'esta imagen'}". Esta acción no se puede deshacer.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const EMPTY_IMAGES: ServiceGalleryImage[] = []

export default function ServiceGalleryManager({ serviceId }: ServiceGalleryManagerProps) {
  const { data: service, isLoading: isLoadingService } = useServiceById(serviceId)
  const { data: fetchedImages = EMPTY_IMAGES, isLoading: isLoadingImages } = useServiceGallery(serviceId)
  const deleteImage = useDeleteServiceGalleryImage(serviceId)
  const updateOrder = useUpdateServiceGalleryOrder(serviceId)

  const [images, setImages] = useState(fetchedImages)
  const [sheetState, dispatchSheet] = useReducer(sheetReducer, { isOpen: false, editingImage: null, newImageNonce: 0 })
  const [deleteState, dispatchDelete] = useReducer(deleteDialogReducer, { isOpen: false, imageToDelete: null })

  // Espeja `fetchedImages` en estado local: el reorder se aplica al soltar,
  // sin esperar a que la mutation optimista redondee por el query cache —
  // evita el salto "va y vuelve" mientras el cache todavía tiene el orden viejo.
  useEffect(() => {
    setImages(fetchedImages)
  }, [fetchedImages])

  // Las páginas son slices contiguos de `images`, así que arrastrar dentro de
  // una página sigue reordenando índices globales correctos. El reorden entre
  // páginas no es posible por drag (solo se renderizan los ids de la página
  // visible); el usuario puede lograrlo editando desde páginas adyacentes.
  const { paginatedItems: paginatedImages, page, totalPages, goToPage, pageSize } = usePagination(images, { pageSize: 12 })

  const handleCreate = () => {
    dispatchSheet({ type: 'opened', image: null })
  }

  const handleEdit = (image: ServiceGalleryImage) => {
    dispatchSheet({ type: 'opened', image })
  }

  const handleDelete = (image: ServiceGalleryImage) => {
    dispatchDelete({ type: 'requested', image })
  }

  const confirmDelete = async () => {
    if (!deleteState.imageToDelete) return
    try {
      await deleteImage.mutateAsync(deleteState.imageToDelete.id)
      toast.success('Imagen eliminada', {
        description: 'La imagen se eliminó correctamente de la galería',
      })
    } catch {
      toast.error('Error al eliminar', {
        description: 'No se pudo eliminar la imagen. Intenta nuevamente.',
      })
    } finally {
      dispatchDelete({ type: 'resolved' })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex(i => i.id === active.id)
    const newIndex = images.findIndex(i => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(images, oldIndex, newIndex)
    setImages(reordered)

    const updates = reordered.map((image, i) => ({ id: image.id, order: i }))

    try {
      await updateOrder.mutateAsync(updates)
    } catch {
      toast.error('Error al reordenar', {
        description: 'No se pudo actualizar el orden. Intenta nuevamente.',
      })
    }
  }

  if (isLoadingService || isLoadingImages) {
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

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-white/10">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40 mb-2">
                  Galería de servicio
                </p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h1
                    className="text-3xl md:text-4xl italic text-white wrap-break-word"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {service ? service.title : 'Galería'}
                  </h1>
                  {images.length > 0 && (
                    <span className="shrink-0 font-mono text-xs tabular-nums text-white/40">
                      {String(images.length).padStart(2, '0')} {images.length === 1 ? 'imagen' : 'imágenes'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/50 mt-2">
                  {totalPages > 1
                    ? 'Arrastra las imágenes para reordenarlas dentro de cada página'
                    : 'Arrastra las imágenes para reordenarlas'}
                </p>
              </div>
              <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto shrink-0">
                <Plus className="w-4 h-4" />
                Agregar Imágenes
              </Button>
            </div>

            {images.length === 0 ? (
              <button
                type="button"
                onClick={handleCreate}
                className="w-full bg-[#1a1a1a] hover:bg-[#1f1f1f] rounded-xl border border-dashed border-white/10 hover:border-white/25 h-64 flex flex-col items-center justify-center gap-4 text-center px-4 transition-colors duration-300"
              >
                <div className="flex items-center justify-center h-14 w-14 rounded-full border border-white/10 bg-white/5">
                  <Images className="w-5 h-5 text-white/50" />
                </div>
                <div>
                  <p
                    className="text-lg italic text-white/80"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Aún no hay imágenes
                  </p>
                  <p className="text-xs text-white/40 mt-1.5 font-mono uppercase tracking-widest">
                    Toca para agregar las primeras
                  </p>
                </div>
              </button>
            ) : (
              <>
                <GalleryGrid
                  images={paginatedImages}
                  pageOffset={(page - 1) * pageSize}
                  onDragEnd={handleDragEnd}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
                <PaginationControls page={page} totalPages={totalPages} onPageChange={goToPage} className="mt-6" />
              </>
            )}
          </div>
        </div>
      </div>

      <GalleryImageSheet
        key={sheetState.editingImage?.id ?? `new-${sheetState.newImageNonce}`}
        serviceId={serviceId}
        image={sheetState.editingImage}
        isOpen={sheetState.isOpen}
        onOpenChange={(open) => dispatchSheet({ type: 'openChanged', open })}
      />

      <DeleteGalleryImageDialog
        isOpen={deleteState.isOpen}
        image={deleteState.imageToDelete}
        onOpenChange={(open) => dispatchDelete({ type: 'openChanged', open })}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
