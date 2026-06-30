import Sidebar from '@/components/dashboard/Sidebar'
import { SidebarProvider } from '@/components/animate-ui/components/radix/sidebar'
import SidebarHeaderTrigger from '@/components/dashboard/Header'

export const metadata = {
  title: 'Photographic Images — Admin',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#0d0d0d]">
        <Sidebar />
        <main className="flex-1 bg-[#0d0d0d]">
          <SidebarHeaderTrigger />
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
