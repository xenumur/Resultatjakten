import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { countryToFlag } from '@/lib/utils/flags'
import { calculateStandings } from '@/lib/scoring/standings'
import { Table, Trophy, Info, ArrowLeft } from 'lucide-react'

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const resolvedParams = await params;
  const { id: groupId, gameId } = resolvedParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: game, error } = await supabase
    .from('games')
    .select(`
      *,
      matches (
        id,
        home_team,
        away_team,
        status,
        final_home_score,
        final_away_score,
        group_name
      )
    `)
    .eq('id', gameId)
    .single()

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  const isAdmin = member?.role === 'admin'

  if (error || !game) {
    return <div className="p-12 text-center text-red-500 font-bold">Spelet hittades inte.</div>
  }

  const groupStandings = calculateStandings(game.matches)

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <Link href={`/dashboard/groups/${groupId}/games/${gameId}`} className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition flex items-center gap-2 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Tillbaka till Spelet
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Table className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">Gruppställning</h1>
          </div>
          {isAdmin && (
            <Link
              href={`/dashboard/groups/${groupId}/games/${gameId}/bracket`}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl sm:rounded-2xl transition shadow-lg shadow-emerald-600/20 self-start sm:self-auto text-[10px] sm:text-xs uppercase tracking-widest"
            >
              🌳 Visa Slutspelsbracket
            </Link>
          )}
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Aktuell tabell för alla grupper i {game.name}.</p>
      </div>

      {/* Info Alert */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 p-4 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-xs md:text-sm text-indigo-700 dark:text-indigo-300 font-medium">
          Tabellen uppdateras automatiskt när matchresultat registreras. Vid lika poäng tillämpas FIFA:s tie-breakers (Målskillnad &gt; Gjorda mål &gt; Inbördes möten).
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {groupStandings.map((group) => (
          <div key={group.groupName} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">{group.groupName}</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">VM 2026</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/30 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800">
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 w-12">#</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Lag</th>
                    <th className="py-4 px-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">SM</th>
                    <th className="py-4 px-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">MS</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">P</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {group.standings.map((team, index) => {
                    const advances = index < 2; // In 2026, top 2 advance. 3rd places are trickier.
                    
                    return (
                      <tr key={team.team} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                            advances ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-zinc-400'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{countryToFlag(team.team)}</span>
                            <span className="font-bold text-zinc-900 dark:text-white text-sm truncate max-w-[120px]">{team.team}</span>
                            {advances && <Trophy className="w-3 h-3 text-emerald-500 opacity-50" />}
                          </div>
                        </td>
                        <td className="py-4 px-3 text-center text-sm font-bold text-zinc-500">{team.played}</td>
                        <td className="py-4 px-3 text-center text-sm font-black text-zinc-400">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                        <td className="py-4 px-4 text-right">
                          <span className={`text-base font-black ${advances ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                            {team.pts}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {groupStandings.length === 0 && (
        <div className="p-20 text-center text-zinc-400 font-bold italic bg-zinc-50 dark:bg-zinc-900/50 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          Ingen statistik tillgänglig för gruppspelet ännu.
        </div>
      )}
    </div>
  )
}
