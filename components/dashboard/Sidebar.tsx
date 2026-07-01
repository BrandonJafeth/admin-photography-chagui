'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  Sidebar as AnimateSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/animate-ui/components/radix/sidebar'
import {
  LayoutDashboard,
  Briefcase,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const UserMenu = dynamic(() => import('./UserMenu'), { ssr: false })

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/servicios', label: 'Servicios', icon: Briefcase },
  { href: '/paquetes', label: 'Paquetes', icon: Package },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <AnimateSidebar className="!bg-[#070707] border-r border-white/10">
      <SidebarHeader className="p-4 border-b border-white/10 !bg-[#070707]">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="text-white hover:bg-white/10" />
          <h3
            className="text-xl text-white italic truncate"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Photographic Images
          </h3>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3 !bg-[#070707]">
        <SidebarMenu>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname?.startsWith(href)
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild>
                  <Link
                    href={href}
                    className={cn(
                      'text-sm gap-2.5 transition-colors',
                      isActive
                        ? 'bg-white text-black font-medium hover:bg-white hover:text-black'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10 !bg-[#070707]">
        <UserMenu />
        <p className="text-xs text-white/30 text-center mt-2">v1.0</p>
      </SidebarFooter>
    </AnimateSidebar>
  )
}
