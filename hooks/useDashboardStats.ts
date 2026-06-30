import { useQuery } from '@tanstack/react-query'
import { ServicesService } from '@/services/services.service'
import { PackagesService } from '@/services/packages.service'
import { TestimonialsService } from '@/services/testimonials.service'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [services, packages, testimonials] = await Promise.all([
        ServicesService.getAll(),
        PackagesService.getAll(),
        TestimonialsService.getAll(),
      ])

      const visibleTestimonials = testimonials.filter(t => t.is_visible)
      const averageRating = visibleTestimonials.length > 0
        ? visibleTestimonials.reduce((sum, t) => sum + t.rating, 0) / visibleTestimonials.length
        : 0

      return {
        activeServices: services.filter(s => s.is_active).length,
        activePackages: packages.filter(p => p.is_active).length,
        visibleTestimonials: visibleTestimonials.length,
        averageRating,
      }
    },
  })
}
