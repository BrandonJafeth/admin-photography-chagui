import Sidebar from '@/components/dashboard/Sidebar'
import { SidebarProvider } from '@/components/animate-ui/components/radix/sidebar'
import SidebarHeaderTrigger from '@/components/dashboard/Header'
import SessionGuard from '@/components/dashboard/SessionGuard'

export const metadata = {
  title: 'Photographic Images — Admin',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SessionGuard />
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-[#0d0d0d]">
        <Sidebar />
        <main className="flex-1 min-w-0 bg-[#0d0d0d]">
          <SidebarHeaderTrigger />
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
