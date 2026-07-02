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
  // scope: 'local' — solo cierra la sesión de este navegador/dispositivo.
  // El default de Supabase es 'global', que revoca la sesión en TODOS los
  // dispositivos de la cuenta; eso rompía "recordarme" cross-device.
  const { error } = await supabaseClient.auth.signOut({ scope: 'local' })

  clearRememberState()

  if (error) throw error
}
