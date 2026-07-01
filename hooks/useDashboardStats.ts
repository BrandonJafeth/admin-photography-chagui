import { useQuery } from '@tanstack/react-query'
import { ServicesService } from '@/services/services.service'
import { PackagesService } from '@/services/packages.service'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [services, packages] = await Promise.all([
        ServicesService.getAll(),
        PackagesService.getAll(),
      ])

      return {
        activeServices: services.filter(s => s.is_active).length,
        activePackages: packages.filter(p => p.is_active).length,
      }
    },
  })
}
