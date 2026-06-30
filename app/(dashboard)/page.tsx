'use client'

import { useDashboardStats } from '@/hooks/useDashboardStats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StarRating } from '@/components/ui/StarRating'
import { Briefcase, Package, MessageSquareQuote, Star } from 'lucide-react'

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 bg-[#0d0d0d] min-h-full">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-8 bg-[#0d0d0d] min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/60">Bienvenido al panel de administración de Photographic Images</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Servicios Activos
            </CardTitle>
            <Briefcase className="h-4 w-4 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.activeServices ?? 0}</div>
            <p className="text-xs text-white/40 mt-1">Servicios visibles en el sitio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Paquetes Disponibles
            </CardTitle>
            <Package className="h-4 w-4 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.activePackages ?? 0}</div>
            <p className="text-xs text-white/40 mt-1">Paquetes activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Testimonios
            </CardTitle>
            <MessageSquareQuote className="h-4 w-4 text-white/40" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.visibleTestimonials ?? 0}</div>
            <p className="text-xs text-white/40 mt-1">Testimonios visibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/60">
              Rating Promedio
            </CardTitle>
            <Star className="h-4 w-4 text-white/40" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-white">
              {stats?.averageRating ? stats.averageRating.toFixed(1) : '—'}
            </div>
            <StarRating value={Math.round(stats?.averageRating ?? 0)} readOnly size={14} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
