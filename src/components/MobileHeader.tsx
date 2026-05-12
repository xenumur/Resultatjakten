'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Home, Users, PlusCircle, Bell, LogOut, User, Menu, X } from 'lucide-react'

interface MobileHeaderProps {
  unreadCount: number
  profileName: string
  logoutAction: () => void
}

export function MobileHeader({ unreadCount, profileName, logoutAction }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      <header className="md:hidden flex bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3 justify-between items-center sticky top-0 z-[60] shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={closeMenu}>
          <img src="/logo.png" alt="Skorio" className="w-8 h-8 object-contain rounded-lg" />
          <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">Skorio</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Link href="/dashboard/notifications" className="relative p-2 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <button 
            onClick={toggleMenu}
            className="p-2 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors active:scale-90"
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
      />

      {/* Mobile Menu Content (Drawer) */}
      <div 
        className={`fixed top-0 right-0 h-[100dvh] w-[280px] bg-white dark:bg-zinc-950 z-[56] md:hidden shadow-2xl transition-transform duration-300 ease-out flex flex-col pt-[calc(max(env(safe-area-inset-top),16px)+60px)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          <div className="pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Inloggad som</p>
            <p className="font-bold text-zinc-900 dark:text-white truncate">{profileName}</p>
          </div>

          <MenuLink href="/dashboard" icon={<Home />} label="Hem" onClick={closeMenu} />
          <MenuLink 
            href="/dashboard/notifications" 
            icon={<Bell />} 
            label="Notifikationer" 
            badge={unreadCount}
            onClick={closeMenu} 
          />
          <MenuLink href="/dashboard/groups/create" icon={<PlusCircle />} label="Skapa ny grupp" onClick={closeMenu} />
          <MenuLink href="/dashboard/groups/join" icon={<Users />} label="Gå med i grupp" onClick={closeMenu} />
          <MenuLink href="/dashboard/profile" icon={<User />} label="Min profil" onClick={closeMenu} />
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 pb-[calc(env(safe-area-inset-bottom)+24px)]">
          <form action={logoutAction}>
            <button className="w-full flex items-center justify-center gap-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-black py-4 rounded-2xl transition-all active:scale-95">
              <LogOut className="w-5 h-5" />
              Logga ut
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

function MenuLink({ href, icon, label, badge, onClick }: { href: string, icon: React.ReactNode, label: string, badge?: number, onClick: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-2xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-bold"
    >
      <span className="w-6 h-6">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  )
}
