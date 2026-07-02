'use client'

import { Label } from '@/components/ui/label'

interface DisplayModeToggleProps {
  useCarousel: boolean
  onChange: (useCarousel: boolean) => void
  disabled?: boolean
  /** false cuando la galería no tiene suficientes imágenes para el carrusel */
  carouselEligible?: boolean
  /** mensaje a mostrar cuando carouselEligible es false */
  ineligibleHint?: string
}

export function DisplayModeToggle({
  useCarousel,
  onChange,
  disabled,
  carouselEligible = true,
  ineligibleHint = 'Agrega al menos 2 imágenes a la galería para activar el carrusel.',
}: DisplayModeToggleProps) {
  const carouselDisabled = disabled || !carouselEligible

  return (
    <div className="space-y-2 border-t border-white/10 pt-6">
      <Label className="text-sm font-medium">Visualización en la landing</Label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(false)}
          className={`flex-1 h-11 rounded-md border text-sm font-medium transition-colors ${
            !useCarousel
              ? 'bg-white/10 border-white/30 text-white'
              : 'border-white/15 text-white/50 hover:text-white/80 hover:border-white/25'
          }`}
        >
          Imagen única
        </button>
        <button
          type="button"
          disabled={carouselDisabled}
          title={!carouselEligible ? ineligibleHint : undefined}
          onClick={() => onChange(true)}
          className={`flex-1 h-11 rounded-md border text-sm font-medium transition-colors ${
            useCarousel
              ? 'bg-white/10 border-white/30 text-white'
              : 'border-white/15 text-white/50 hover:text-white/80 hover:border-white/25'
          } ${carouselDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          Carrusel de galería
        </button>
      </div>
      <p className="text-xs text-white/40">
        {!carouselEligible
          ? ineligibleHint
          : useCarousel
            ? 'La landing mostrará el carrusel con las imágenes de la galería del servicio.'
            : 'La landing mostrará la imagen principal del servicio.'}
      </p>
    </div>
  )
}
