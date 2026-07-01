'use client'

import { signIn, SignInPayload } from '@/services/auth.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation<unknown, Error, SignInPayload>({
    mutationFn: async (payload: SignInPayload) => {
      return await signIn(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      router.push('/')
    },
  })
}
