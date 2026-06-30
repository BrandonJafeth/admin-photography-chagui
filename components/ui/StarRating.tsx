'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: number
}

export function StarRating({ value, onChange, readOnly = false, size = 20 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
        >
          <Star
            width={size}
            height={size}
            className={star <= value ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-white/20'}
          />
        </button>
      ))}
    </div>
  )
}
