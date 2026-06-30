'use client'

import { useParams } from 'next/navigation'
import ServiceFaqsManager from '@/components/features/service-faqs/ServiceFaqsManager'

export default function ServiceFaqsPage() {
  const params = useParams<{ id: string }>()
  const serviceId = params?.id ?? ''

  return <ServiceFaqsManager serviceId={serviceId} />
}
