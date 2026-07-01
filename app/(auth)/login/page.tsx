"use client"

import React, { useState } from 'react'
import { Eye, EyeOff, Camera, Mail, Lock } from 'lucide-react'
import { useLogin } from '@/hooks/useLogin'
import type { SignInPayload } from '@/services/auth.service'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const { mutateAsync } = useLogin()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload: SignInPayload = { email, password, rememberMe }
      await mutateAsync(payload)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-[18px] h-[18px] rounded-md border border-white/15 bg-[#0d0d0d] accent-white cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-white/10"
                  />
                  <span className="text-sm text-[#999999] group-hover:text-white/90 transition-colors select-none">
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
