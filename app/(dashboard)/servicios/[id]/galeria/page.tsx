'use client'

import { useParams } from 'next/navigation'
import ServiceGalleryManager from '@/components/features/service-gallery/ServiceGalleryManager'

export default function ServiceGalleryPage() {
  const params = useParams<{ id: string }>()
  const serviceId = params?.id ?? ''

  return <ServiceGalleryManager serviceId={serviceId} />
}
