'use client'

import { signIn, SignInPayload } from '@/services/auth.service'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

export function useLogin() {
  const router = useRouter()

  return useMutation<unknown, Error, SignInPayload>({
    mutationFn: async (payload: SignInPayload) => {
      return await signIn(payload)
    },
    onSuccess: async () => {
      router.push('/')
    },
  })
}
