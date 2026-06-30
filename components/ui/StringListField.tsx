'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'

interface StringListFieldProps {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export function StringListField({
  label,
  items,
  onChange,
  placeholder = 'Ej: 8 horas de cobertura',
  disabled = false,
}: StringListFieldProps) {
  const handleAdd = () => {
    onChange([...items, ''])
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleUpdate = (index: number, value: string) => {
    onChange(items.map((item, i) => (i === index ? value : item)))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/90">{label}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-white/40">No hay ítems. Agrega uno para comenzar.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => handleUpdate(index, e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
