import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Medal } from 'lucide-react'

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const resolvedParams = await params;
  const { id: groupId, gameId } = resolvedParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: members } = await supabase
    .from('group_members')
    .select(`
      user_id,
      profiles:user_id(display_name)
    `)
    .eq('group_id', groupId)

  const { data: predictions } = await supabase
    .from('predictions')
    .select('user_id, points_awarded')
    .eq('game_id', gameId)
    .not('points_awarded', 'is', null)

  const leaderboard = members?.map(member => {
    const userPredictions = predictions?.filter(p => p.user_id === member.user_id) || []
    const totalPoints = userPredictions.reduce((sum, p) => sum + (p.points_awarded || 0), 0)
    // En helt perfekt match ger numera 7 poäng
    const exactMatches = userPredictions.filter(p => p.points_awarded === 7).length
    
    return {
      userId: member.user_id,
      name: (member.profiles as any)?.display_name || 'Okänd',
      totalPoints,
      exactMatches,
      matchesPlayed: userPredictions.length
    }
  }).sort((a, b) => b.totalPoints - a.totalPoints || b.exactMatches - a.exactMatches) || []

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Link href={`/dashboard/groups/${groupId}/games/${gameId}`} className="inline-flex items-center text-sm font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors active:scale-95">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Tillbaka till Spelet
      </Link>

      <div className="flex items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Leaderboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">Vem är bäst på att tippa?</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-zinc-400">Pos</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-zinc-400">Spelare</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-zinc-400 hidden sm:table-cell text-center">Exakta träffar</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-zinc-400 hidden md:table-cell text-center">Spelade</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-indigo-500 text-right">Poäng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {leaderboard.map((entry, index) => {
                const isTop3 = index < 3;
                return (
                <tr key={entry.userId} className={`group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${entry.userId === user.id ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}>
                  <td className="p-5 w-16">
                    {index === 0 ? <Medal className="w-8 h-8 text-amber-400" /> : 
                     index === 1 ? <Medal className="w-8 h-8 text-zinc-300" /> : 
                     index === 2 ? <Medal className="w-8 h-8 text-amber-700" /> : 
                     <span className="text-xl font-bold text-zinc-400 pl-2">{index + 1}</span>}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isTop3 ? 'bg-indigo-600 text-white shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
                        {entry.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-bold ${isTop3 ? 'text-lg text-zinc-900 dark:text-white' : 'text-base text-zinc-700 dark:text-zinc-200'}`}>
                          {entry.name}
                        </span>
                        {entry.userId === user.id && (
                          <span className="text-xs font-bold text-indigo-500 tracking-wide uppercase">Det är du</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-5 hidden sm:table-cell text-center font-medium text-zinc-500">{entry.exactMatches}</td>
                  <td className="p-5 hidden md:table-cell text-center font-medium text-zinc-500">{entry.matchesPlayed}</td>
                  <td className="p-5 text-right">
                    <span className={`font-black ${isTop3 ? 'text-3xl text-indigo-600 dark:text-indigo-400' : 'text-2xl text-zinc-700 dark:text-zinc-300'}`}>
                      {entry.totalPoints}
                    </span>
                  </td>
                </tr>
              )})}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-zinc-500 font-medium">
                    Leaderboarden är tom just nu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
