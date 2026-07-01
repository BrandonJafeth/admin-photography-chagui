'use client'

import { useState } from 'react'
import { LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signOut } from '../../services/auth.service'

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors w-full"
      >
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-white/70" />
        </div>
        <div className="text-left block min-w-0">
          <p className="text-sm font-medium text-white truncate">Isaías Díaz García</p>
          <p className="text-xs text-white/40 truncate">Administrador</p>
        </div>
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setIsOpen(false)}
            onKeyDown={e => e.key === 'Escape' && setIsOpen(false)}
          />
          <div className="absolute left-0 bottom-full mb-2 w-56 bg-[#1a1a1a] rounded-lg shadow-lg border border-white/10 py-1 z-20">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
