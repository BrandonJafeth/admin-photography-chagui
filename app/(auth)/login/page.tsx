"use client"

import React, { useReducer, useState } from 'react'
import { Eye, EyeOff, Camera, Mail, Lock } from 'lucide-react'
import { useLogin } from '@/hooks/useLogin'
import type { SignInPayload } from '@/services/auth.service'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

type FormState = { email: string; password: string; rememberMe: boolean }
type FormAction =
  | { type: 'fieldChanged'; name: keyof FormState; value: string | boolean }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'fieldChanged':
      return { ...state, [action.name]: action.value }
  }
}

type SubmissionState = { loading: boolean; error: string | null }
type SubmissionAction =
  | { type: 'submitStarted' }
  | { type: 'submitSucceeded' }
  | { type: 'submitFailed'; error: string }

function submissionReducer(state: SubmissionState, action: SubmissionAction): SubmissionState {
  switch (action.type) {
    case 'submitStarted':
      return { loading: true, error: null }
    case 'submitSucceeded':
      return { loading: false, error: null }
    case 'submitFailed':
      return { loading: false, error: action.error }
  }
}

export default function LoginPage() {
  const currentYear = new Date().getFullYear()
  const [form, dispatchForm] = useReducer(formReducer, { email: '', password: '', rememberMe: false })
  const [showPassword, setShowPassword] = useState(false)

  const { mutateAsync } = useLogin()
  const [submission, dispatchSubmission] = useReducer(submissionReducer, { loading: false, error: null })
  const { loading, error } = submission

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    dispatchSubmission({ type: 'submitStarted' })

    try {
      const payload: SignInPayload = form
      await mutateAsync(payload)
      dispatchSubmission({ type: 'submitSucceeded' })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      dispatchSubmission({ type: 'submitFailed', error: message || 'Error al iniciar sesión' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-background to-[#1A1A1A]" />

      {/* Patrón de ruido sutil (opcional) */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />

      {/* Contenedor del formulario */}
      <div className="relative z-10 w-full max-w-[440px] px-6">
        {/* Contenido */}
        <div className="w-full">
            {/* Logo y branding */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center mb-6">
                <Camera className="w-12 h-12 text-white" strokeWidth={1.5} />
              </div>
              <h1
                className="text-[32px] italic text-white mb-3"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Photographic Images
              </h1>
              <p className="text-sm font-medium text-[#999999] tracking-[0.15em] uppercase">
                Panel Administrativo
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Campo Email */}
              <div className="space-y-2.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/70 transition-colors z-10 pointer-events-none">
                    <Mail className="w-[18px] h-[18px]" strokeWidth={2} />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@gadeaiso.com"
                    value={form.email}
                    onChange={(e) => dispatchForm({ type: 'fieldChanged', name: 'email', value: e.target.value })}
                    required
                    autoComplete="email"
                    className="h-[52px] pl-11 pr-4 text-[15px] rounded-xl"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div className="space-y-2.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/70 transition-colors z-10 pointer-events-none">
                    <Lock className="w-[18px] h-[18px]" strokeWidth={2} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => dispatchForm({ type: 'fieldChanged', name: 'password', value: e.target.value })}
                    required
                    autoComplete="current-password"
                    className="h-[52px] pl-11 pr-12 text-[15px] rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 active:scale-90 transition-all focus:outline-none z-10"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-[18px] h-[18px]" strokeWidth={2} />
                    ) : (
                      <Eye className="w-[18px] h-[18px]" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              {/* Recordarme */}
              <div className="flex items-center pt-1">
                <label
                  htmlFor="rememberMe"
                  className="flex items-center gap-2.5 -m-2 p-2 cursor-pointer touch-manipulation select-none group"
                >
                  <Checkbox
                    id="rememberMe"
                    checked={form.rememberMe}
                    onCheckedChange={(checked) => dispatchForm({ type: 'fieldChanged', name: 'rememberMe', value: checked === true })}
                  />
                  <span className="text-sm text-[#999999] group-hover:text-white/90 transition-colors">
                    Recordarme en este dispositivo
                  </span>
                </label>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-sm text-red-400 text-center">{error}</p>
                </div>
              )}

              {/* Botón de inicio de sesión */}
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full h-[52px] mt-8 text-[15px] font-semibold rounded-xl',
                  'transition-transform duration-150 ease-out active:scale-[0.98]'
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs text-[#4A4A4A] mt-10 tracking-[0.15em] font-medium">
          © {currentYear} Photographic Images
        </p>
      </div>
    </div>
  )
}
