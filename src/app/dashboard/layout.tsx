import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/(auth)/login/actions'
import { getUnreadCount } from '@/app/dashboard/notifications/actions'
import Link from 'next/link'
import { Home, Users, PlusCircle, LogOut, Bell } from 'lucide-react'

import { MobileHeader } from '@/components/MobileHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const unreadCount = await getUnreadCount()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      
      {/* Desktop Header */}
      <header className="hidden md:flex bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-8 py-4 justify-between items-center sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="Resultatjakten" className="w-10 h-10 object-contain rounded-xl shadow-sm" />
          <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500 hidden lg:block">
            Skorio
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/dashboard/notifications" className="relative p-2 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link 
            href="/dashboard/profile" 
            className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 border-l border-zinc-200 dark:border-zinc-800 pl-6 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {profile?.display_name || user.email}
          </Link>
          <form action={logout}>
            <button className="text-sm font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-5 py-2.5 rounded-full transition-transform active:scale-95 flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Logga ut
            </button>
          </form>
        </div>
      </header>

      {/* Mobile Header (Top) */}
      <MobileHeader 
        unreadCount={unreadCount} 
        profileName={profile?.display_name || user.email || 'Användare'} 
        logoutAction={logout}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto md:p-6 lg:p-10">
        {children}
      </main>
    </div>
  )
}
