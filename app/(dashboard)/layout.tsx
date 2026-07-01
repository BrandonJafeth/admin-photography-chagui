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
      <div className="flex h-screen w-full max-w-full overflow-hidden bg-[#0d0d0d]">
        <Sidebar />
        <main className="flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-[#0d0d0d]">
          <SidebarHeaderTrigger />
          <div className="flex-1 min-h-0">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
