// hooks/usePagination.ts
'use client'

import { useMemo, useState } from 'react'

interface UsePaginationOptions {
  pageSize?: number
}

/**
 * Paginación client-side genérica sobre cualquier array. `page` se clampea
 * automáticamente contra `totalPages` para que borrar/filtrar items nunca
 * deje la vista en una página vacía.
 */
export function usePagination<T>(items: T[], { pageSize = 10 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const paginatedItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  )

  return {
    page: safePage,
    totalPages,
    pageSize,
    paginatedItems,
    goToPage: (target: number) => setPage(Math.min(Math.max(1, target), totalPages)),
  }
}
