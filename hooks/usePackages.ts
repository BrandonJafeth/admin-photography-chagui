// hooks/usePackages.ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PackagesService,
  type Package,
  type CreatePackagePayload,
  type UpdatePackagePayload,
} from '@/services/packages.service'

/**
 * Hook para obtener todos los paquetes
 */
export function usePackages() {
  return useQuery({
    queryKey: ['packages'],
    queryFn: () => PackagesService.getAll(),
  })
}

/**
 * Hook para obtener un paquete por ID
 */
export function usePackageById(id: string) {
  return useQuery({
    queryKey: ['packages', id],
    queryFn: () => PackagesService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook para crear un paquete
 */
export function useCreatePackage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePackagePayload) => PackagesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Hook para actualizar un paquete
 */
export function useUpdatePackage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePackagePayload }) =>
      PackagesService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['packages'] })
      const previousPackages = queryClient.getQueryData<Package[]>(['packages'])

      queryClient.setQueryData<Package[]>(['packages'], (old) =>
        old?.map((pkg) => (pkg.id === id ? { ...pkg, ...payload } : pkg))
      )

      return { previousPackages }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPackages) {
        queryClient.setQueryData(['packages'], context.previousPackages)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Hook para eliminar un paquete
 */
export function useDeletePackage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => PackagesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
