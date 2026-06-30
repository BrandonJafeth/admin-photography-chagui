'use client'

import { SidebarTrigger } from '@/components/animate-ui/components/radix/sidebar'

export default function SidebarHeaderTrigger() {
  return (
    <div className="flex items-center border-b border-white/10 bg-[#0d0d0d] h-15 px-4 md:px-6">
      <SidebarTrigger className="text-white hover:bg-white/10" />
    </div>
  )
}
