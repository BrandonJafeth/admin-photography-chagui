'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'

interface PaginationControlsProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationControls({ page, totalPages, onPageChange, className }: PaginationControlsProps) {
  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-between gap-6 border-t border-white/10 pt-4 ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="group flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em] text-white/50 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-30"
        aria-label="Página anterior"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Anterior
      </button>

      <p className="font-mono text-[11px] tabular-nums tracking-[0.2em] text-white/35 select-none">
        <span className="text-white/80">{String(page).padStart(2, '0')}</span>
        {' — '}
        {String(totalPages).padStart(2, '0')}
      </p>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="group flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em] text-white/50 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-30"
        aria-label="Página siguiente"
      >
        Siguiente
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}
