// hooks/useServiceGallery.ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ServiceGalleryService,
  type ServiceGalleryImage,
  type CreateServiceGalleryImagePayload,
  type UpdateServiceGalleryImagePayload,
} from '@/services/service-gallery.service'

/**
 * Hook para obtener la galería de un servicio
 */
export function useServiceGallery(serviceId: string) {
  return useQuery({
    queryKey: ['service-gallery', serviceId],
    queryFn: () => ServiceGalleryService.getByServiceId(serviceId),
    enabled: !!serviceId,
  })
}

/**
 * Hook para agregar una imagen a la galería
 */
export function useCreateServiceGalleryImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateServiceGalleryImagePayload) => ServiceGalleryService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-gallery', data.service_id] })
    },
  })
}

/**
 * Hook para actualizar una imagen de la galería
 */
export function useUpdateServiceGalleryImage(serviceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServiceGalleryImagePayload }) =>
      ServiceGalleryService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['service-gallery', serviceId] })
      const previousImages = queryClient.getQueryData<ServiceGalleryImage[]>(['service-gallery', serviceId])

      queryClient.setQueryData<ServiceGalleryImage[]>(['service-gallery', serviceId], (old) =>
        old?.map((image) => (image.id === id ? { ...image, ...payload } : image))
      )

      return { previousImages }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousImages) {
        queryClient.setQueryData(['service-gallery', serviceId], context.previousImages)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['service-gallery', serviceId] })
    },
  })
}

/**
 * Hook para eliminar una imagen de la galería
 */
export function useDeleteServiceGalleryImage(serviceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ServiceGalleryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-gallery', serviceId] })
    },
  })
}

/**
 * Hook para actualizar el orden de las imágenes de la galería
 */
export function useUpdateServiceGalleryOrder(serviceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{ id: string; order: number }>) =>
      ServiceGalleryService.updateOrder(updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['service-gallery', serviceId] })
      const previousImages = queryClient.getQueryData<ServiceGalleryImage[]>(['service-gallery', serviceId])
      const orderById = new Map(updates.map((u) => [u.id, u.order]))

      queryClient.setQueryData<ServiceGalleryImage[]>(['service-gallery', serviceId], (old) =>
        old
          ?.map((image) => ({ ...image, order: orderById.get(image.id) ?? image.order }))
          .sort((a, b) => a.order - b.order)
      )

      return { previousImages }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousImages) {
        queryClient.setQueryData(['service-gallery', serviceId], context.previousImages)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['service-gallery', serviceId] })
    },
  })
}
