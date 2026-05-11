import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/(auth)/login/actions'
import Link from 'next/link'
import { Home, Users, PlusCircle, LogOut, Bell } from 'lucide-react'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
      
      {/* Desktop Header */}
      <header className="hidden md:flex bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-8 py-4 justify-between items-center sticky top-0 z-50">
        <Link href="/dashboard" className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500">
          Resultatjakten
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/dashboard/notifications" className="relative p-2 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">
            <Bell className="w-6 h-6" />
          </Link>
          <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 border-l border-zinc-200 dark:border-zinc-800 pl-6">
            {profile?.display_name || user.email}
          </span>
          <form action={logout}>
            <button className="text-sm font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-5 py-2.5 rounded-full transition-transform active:scale-95 flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Logga ut
            </button>
          </form>
        </div>
      </header>

      {/* Mobile Header (Top) */}
      <header className="md:hidden flex bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3 justify-between items-center sticky top-0 z-50 shadow-sm">
        <Link href="/dashboard" className="text-xl font-black tracking-tight text-indigo-500">
          Resultatjakten
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/notifications" className="p-2 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">
            <Bell className="w-6 h-6" />
          </Link>
          <form action={logout}>
            <button className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors active:scale-90">
              <LogOut className="w-6 h-6" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto md:p-6 lg:p-10">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)] z-50">
        <div className="flex justify-around items-center h-[64px]">
          <Link href="/dashboard" className="flex flex-col items-center justify-center w-full h-full text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-transform">
            <Home className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Hem</span>
          </Link>
          <Link href="/dashboard/notifications" className="flex flex-col items-center justify-center w-full h-full text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-transform">
            <Bell className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Inkorg</span>
          </Link>
          <Link href="/dashboard/groups/create" className="flex flex-col items-center justify-center w-full h-full text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-transform">
            <PlusCircle className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Ny</span>
          </Link>
          <Link href="/dashboard/groups/join" className="flex flex-col items-center justify-center w-full h-full text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-transform">
            <Users className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Gå Med</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
