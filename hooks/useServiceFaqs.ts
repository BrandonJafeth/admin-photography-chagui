// hooks/useServiceFaqs.ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ServiceFaqsService,
  type ServiceFaq,
  type CreateServiceFaqPayload,
  type UpdateServiceFaqPayload,
} from '@/services/service-faqs.service'

/**
 * Hook para obtener las FAQs de un servicio
 */
export function useServiceFaqs(serviceId: string) {
  return useQuery({
    queryKey: ['service-faqs', serviceId],
    queryFn: () => ServiceFaqsService.getByServiceId(serviceId),
    enabled: !!serviceId,
  })
}

/**
 * Hook para crear una FAQ
 */
export function useCreateServiceFaq() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateServiceFaqPayload) => ServiceFaqsService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-faqs', data.service_id] })
    },
  })
}

/**
 * Hook para actualizar una FAQ
 */
export function useUpdateServiceFaq(serviceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServiceFaqPayload }) =>
      ServiceFaqsService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['service-faqs', serviceId] })
      const previousFaqs = queryClient.getQueryData<ServiceFaq[]>(['service-faqs', serviceId])

      queryClient.setQueryData<ServiceFaq[]>(['service-faqs', serviceId], (old) =>
        old?.map((faq) => (faq.id === id ? { ...faq, ...payload } : faq))
      )

      return { previousFaqs }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousFaqs) {
        queryClient.setQueryData(['service-faqs', serviceId], context.previousFaqs)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['service-faqs', serviceId] })
    },
  })
}

/**
 * Hook para eliminar una FAQ
 */
export function useDeleteServiceFaq(serviceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ServiceFaqsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-faqs', serviceId] })
    },
  })
}

/**
 * Hook para actualizar el orden de las FAQs
 */
export function useUpdateServiceFaqsOrder(serviceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{ id: string; order: number }>) =>
      ServiceFaqsService.updateOrder(updates),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['service-faqs', serviceId] })
      const previousFaqs = queryClient.getQueryData<ServiceFaq[]>(['service-faqs', serviceId])
      const orderById = new Map(updates.map((u) => [u.id, u.order]))

      queryClient.setQueryData<ServiceFaq[]>(['service-faqs', serviceId], (old) =>
        old
          ?.map((faq) => ({ ...faq, order: orderById.get(faq.id) ?? faq.order }))
          .sort((a, b) => a.order - b.order)
      )

      return { previousFaqs }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousFaqs) {
        queryClient.setQueryData(['service-faqs', serviceId], context.previousFaqs)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['service-faqs', serviceId] })
    },
  })
}
