'use client'

import { useState } from 'react'
import { useServices } from '@/hooks/useServices'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { Plus, ArrowDownUp, X } from 'lucide-react'
import { ServicesGrid } from './ServicesGrid'
import { ServiceCreateSheet } from './ServiceCreateSheet'

export default function ServicesManager() {
  const { data: services = [], isLoading } = useServices()
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-y-auto bg-[#0d0d0d]">
        <div className="p-6">
          <div className="max-w-[1400px] mx-auto">
            {/* Header de Sección con Botones */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-[#1a1a1a] p-4 md:p-6 rounded-lg shadow-sm border border-white/10">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">Gestión de Servicios</h1>
                <p className="text-sm text-white/60">Administra los servicios fotográficos que ofreces</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Button
                  variant={isReordering ? 'secondary' : 'outline'}
                  onClick={() => setIsReordering(!isReordering)}
                  className="gap-2 flex-1 sm:flex-none"
                >
                  {isReordering ? (
                    <>
                      <X className="w-4 h-4" />
                      Terminar
                    </>
                  ) : (
                    <>
                      <ArrowDownUp className="w-4 h-4" />
                      Reordenar
                    </>
                  )}
                </Button>

                {isReordering && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                    Modo reordenamiento
                  </span>
                )}

                <Button
                  onClick={() => setIsCreateSheetOpen(true)}
                  disabled={isReordering}
                  className="gap-2 flex-1 sm:flex-none"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Servicio
                </Button>
              </div>
            </div>

            {/* Grid de Servicios */}
            <div>
              <div className="mb-6 bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-white/10">
                {services.length === 0 ? (
                  <Card className="p-12 text-center">
                    <p className="text-white/60">No hay servicios. Agrega uno para comenzar.</p>
                  </Card>
                ) : (
                  <ServicesGrid services={services} isReordering={isReordering} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ServiceCreateSheet
        isOpen={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
      />
    </div>
  )
}
