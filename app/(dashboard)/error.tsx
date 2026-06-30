'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="h-full min-h-[500px] flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-6 flex flex-col items-center text-center space-y-4 shadow-lg border-red-500/20">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">Error en el Dashboard</h3>
          <p className="text-sm text-white/60">
            No pudimos cargar esta sección. Puede ser un problema de conexión o un error temporal.
          </p>
        </div>

        <div className="pt-2">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </Card>
    </div>
  )
}
