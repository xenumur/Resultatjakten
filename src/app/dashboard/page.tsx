import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Plus, Trophy, ChevronRight, LayoutGrid, Info } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Användaren är inte inloggad')
  }

  const [{ data: userGroups }, { data: profile }] = await Promise.all([
    supabase
      .from('group_members')
      .select(`
        group_id,
        groups (
          id,
          name,
          description
        )
      `)
      .eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
  ])

  const groups = userGroups?.map(g => g.groups).filter(Boolean) || []
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Deltagare'

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12">
      {/* Personalized Header Section */}
      <div className="pt-6 md:pt-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mb-2 tracking-tight">
          Välkommen, <span className="text-indigo-600 dark:text-indigo-400">{displayName}</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">Här är dina aktiva grupper och snabbval.</p>
      </div>
      {/* Introduction Button (Centered) */}
      <div className="flex justify-center pb-2 pt-4">
        <Link 
          href="/dashboard/introduction" 
          className="flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-indigo-600 text-white rounded-2xl sm:rounded-[24px] font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 text-[10px] sm:text-xs uppercase tracking-widest hover:scale-105 active:scale-95"
        >
          <Info className="w-4 h-4 sm:w-5 h-5" />
          Introduktion & Regler
        </Link>
      </div>

      {/* Groups List (Top Priority) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Dina grupper</h2>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 rounded-full border border-zinc-100 dark:border-zinc-800">
            {groups.length} {groups.length === 1 ? 'Grupp' : 'Grupper'}
          </span>
        </div>
        
        {groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((g: any) => (
              <Link 
                key={g.id} 
                href={`/dashboard/groups/${g.id}`} 
                className="group relative bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-xl active:scale-[0.98] flex flex-col justify-between min-h-[200px] overflow-hidden"
              >
                {/* Subtle Background Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-6 group-hover:bg-indigo-500 transition-colors">
                    <Trophy className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="font-black text-2xl text-zinc-900 dark:text-white tracking-tight leading-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{g.name}</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 font-medium">{g.description || 'Ingen beskrivning angiven.'}</p>
                </div>

                <div className="flex items-center justify-between mt-8 relative z-10">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Users className="w-3 h-3 text-zinc-400" />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    Gå till <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-[40px] p-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center">
            <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Trophy className="w-8 h-8 text-zinc-300" />
            </div>
            <h4 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">Inga grupper ännu</h4>
            <p className="text-zinc-500 dark:text-zinc-400 mb-0 font-medium max-w-sm mx-auto">Du är inte med i några grupper. Starta en egen grupp nedan för att komma igång!</p>
          </div>
        )}
      </div>

      {/* Quick Actions (Smaller and Moved Down) */}
      <div className="pt-4 space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Andra åtgärder</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <Link href="/dashboard/groups/create" className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-100 dark:border-zinc-800 hover:border-indigo-500 transition-all shadow-sm hover:shadow-md active:scale-95">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 group-hover:text-indigo-600 transition-colors">Ny Grupp</span>
          </Link>

          <Link href="/dashboard/groups/join" className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-100 dark:border-zinc-800 hover:border-emerald-500 transition-all shadow-sm hover:shadow-md active:scale-95">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 group-hover:text-emerald-600 transition-colors">Gå Med</span>
          </Link>
          
          <Link href="/dashboard/profile" className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-100 dark:border-zinc-800 hover:border-zinc-400 transition-all shadow-sm hover:shadow-md active:scale-95">
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300">Profil</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
