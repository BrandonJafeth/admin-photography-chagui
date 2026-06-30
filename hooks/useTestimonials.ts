// hooks/useTestimonials.ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  TestimonialsService,
  type CreateTestimonialPayload,
  type UpdateTestimonialPayload,
} from '@/services/testimonials.service'

/**
 * Hook para obtener todos los testimonios
 */
export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: () => TestimonialsService.getAll(),
  })
}

/**
 * Hook para crear un testimonio
 */
export function useCreateTestimonial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTestimonialPayload) => TestimonialsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Hook para actualizar un testimonio
 */
export function useUpdateTestimonial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTestimonialPayload }) =>
      TestimonialsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Hook para eliminar un testimonio
 */
export function useDeleteTestimonial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => TestimonialsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Hook para actualizar el orden de los testimonios
 */
export function useUpdateTestimonialsOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{ id: string; order: number }>) =>
      TestimonialsService.updateOrder(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
    },
  })
}
