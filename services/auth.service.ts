import supabaseClient from '../lib/supabaseClient'
import { clearRememberState, setRememberMe } from '../lib/session-remember'

export interface SignInPayload {
  email: string
  password: string
  rememberMe?: boolean
}

export async function signIn({ email, password, rememberMe = false }: SignInPayload): Promise<unknown> {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  setRememberMe(rememberMe)

  return data
}

export async function signOut(): Promise<void> {
  const { error } = await supabaseClient.auth.signOut()

  clearRememberState()

  if (error) throw error
}
