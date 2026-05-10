import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Plus, Trophy, ChevronRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Användaren är inte inloggad')
  }

  const { data: userGroups, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups (
        id,
        name,
        description
      )
    `)
    .eq('user_id', user.id)

  const groups = userGroups?.map(g => g.groups).filter(Boolean) || []

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-10">
      
      {/* Header Section */}
      <div className="pt-4 md:pt-0">
        <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white mb-2 tracking-tight">Din Dashboard</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg">Välkommen tillbaka. Redo att tippa?</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Link href="/dashboard/groups/create" className="group relative overflow-hidden p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-zinc-100 dark:border-zinc-800 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-2xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors"></div>
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative z-10">
            <Plus className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold mb-2 relative z-10 text-zinc-900 dark:text-white tracking-tight">Skapa ny grupp</h3>
          <p className="text-zinc-500 dark:text-zinc-400 relative z-10">Starta ett nytt tips för dig och dina vänner. Bli gruppens administratör.</p>
        </Link>

        <Link href="/dashboard/groups/join" className="group relative overflow-hidden p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-zinc-100 dark:border-zinc-800 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-full blur-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors"></div>
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative z-10">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold mb-2 relative z-10 text-zinc-900 dark:text-white tracking-tight">Gå med i grupp</h3>
          <p className="text-zinc-500 dark:text-zinc-400 relative z-10">Har du fått en kod? Knappa in den för att delta i turneringen.</p>
        </Link>
      </div>

      {/* Error Message if fetching fails */}
      {error && (
        <div className="mb-8 p-4 bg-red-100 text-red-700 rounded-2xl border border-red-200">
          <p className="font-bold">Fel vid laddning av grupper:</p>
          <p className="font-mono text-sm mt-1">{error.message}</p>
        </div>
      )}

      {/* Groups List */}
      <div className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Dina grupper</h3>
        </div>
        
        {groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g: any) => (
              <Link key={g.id} href={`/dashboard/groups/${g.id}`} className="group bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex flex-col justify-between h-full min-h-[160px]">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-extrabold text-xl text-zinc-900 dark:text-white tracking-tight">{g.name}</h4>
                    <Trophy className="w-5 h-5 text-indigo-200 dark:text-indigo-900/50 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">{g.description}</p>
                </div>
                <div className="flex items-center text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                  Gå till gruppen <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 border border-dashed border-zinc-300 dark:border-zinc-700 text-center shadow-sm">
            <Trophy className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Inga grupper ännu</h4>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">Du är inte med i några grupper. Börja med att skapa en egen eller gå med i en väns grupp!</p>
          </div>
        )}
      </div>
    </div>
  )
}
