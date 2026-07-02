'use client'

import { useEffect, useRef } from 'react'
import { Pilcrow } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParagraphEditorProps {
  id?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  'aria-invalid'?: boolean
}

/**
 * Textarea que crece con el contenido y ayuda a separar párrafos
 * (el sitio público divide detailed_description por líneas en blanco).
 * Guarda texto plano — no HTML — para no romper ese render.
 */
export function ParagraphEditor({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  maxLength,
  disabled,
  'aria-invalid': ariaInvalid,
}: ParagraphEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 140)}px`
  }

  useEffect(resize, [value])

  const insertParagraphBreak = () => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const before = value.slice(0, start)
    const after = value.slice(end)
    // Evita triplicar saltos si ya hay uno antes del cursor
    const prefix = before.length === 0 || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
    const next = `${before}${prefix}${after}`
    onChange(next)
    const cursor = before.length + prefix.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursor, cursor)
      resize()
    })
  }

  const paragraphCount = value.trim() ? value.trim().split(/\n\s*\n/).filter(Boolean).length : 0
  const len = value.length
  const nearLimit = maxLength != null && len > maxLength * 0.85
  const overLimit = maxLength != null && len > maxLength

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border border-white/15 bg-[#0d0d0d]',
        ariaInvalid && 'border-red-400/60 ring-2 ring-red-400/20',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-2.5 py-1.5">
        <button
          type="button"
          title="Insertar salto de párrafo"
          onMouseDown={(e) => {
            e.preventDefault()
            insertParagraphBreak()
          }}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
        >
          <Pilcrow className="h-3.5 w-3.5" />
          Nuevo párrafo
        </button>
        <span className="text-[11px] text-white/30">
          {paragraphCount} {paragraphCount === 1 ? 'párrafo' : 'párrafos'}
        </span>
        {maxLength != null && (
          <span
            className={cn(
              'ml-auto text-[11px] tabular-nums',
              overLimit ? 'text-red-400' : nearLimit ? 'text-amber-400' : 'text-white/30',
            )}
          >
            {len}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        aria-invalid={ariaInvalid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        rows={5}
        className="w-full resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-white outline-none placeholder:text-white/30"
      />
    </div>
  )
}
