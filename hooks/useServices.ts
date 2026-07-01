// hooks/useServices.ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ServicesService,
  type Service,
  type CreateServicePayload,
  type UpdateServicePayload,
} from '@/services/services.service'

/**
 * Hook para obtener todos los servicios
 */
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => ServicesService.getAll(),
  })
}

/**
 * Hook para obtener un servicio por ID
 */
export function useServiceById(id: string) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: () => ServicesService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook para crear un servicio
 */
export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateServicePayload) =>
      ServicesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

/**
 * Hook para actualizar un servicio
 */
export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServicePayload }) =>
      ServicesService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['services'] })
      const previousServices = queryClient.getQueryData<Service[]>(['services'])

      queryClient.setQueryData<Service[]>(['services'], (old) =>
        old?.map((svc) => (svc.id === id ? { ...svc, ...payload } : svc))
      )

      return { previousServices }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(['services'], context.previousServices)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

/**
 * Hook para eliminar un servicio
 */
export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ServicesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

/**
 * Hook para actualizar el orden de los servicios
 */
export function useUpdateServicesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{ id: string; order: number }>) =>
      ServicesService.updateOrder(updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['services'] })
      const previousServices = queryClient.getQueryData<Service[]>(['services'])
      const orderById = new Map(updates.map((u) => [u.id, u.order]))

      queryClient.setQueryData<Service[]>(['services'], (old) =>
        old
          ?.map((svc) => ({ ...svc, order: orderById.get(svc.id) ?? svc.order }))
          .sort((a, b) => a.order - b.order)
      )

      return { previousServices }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(['services'], context.previousServices)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}
