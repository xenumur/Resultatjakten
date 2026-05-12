import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MatchTabs } from './MatchTabs'

export default async function GameDetailPage({
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
        kickoff_time,
        status,
        final_home_score,
        final_away_score,
        stage,
        group_name,
        venue,
        broadcaster
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
    return <div className="p-12 text-center">Spelet hittades inte.</div>
  }

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)
    .eq('game_id', gameId)

  const predictionMap = new Map(predictions?.map(p => [p.match_id, p]) || [])

  const matches = game.matches.sort((a: any, b: any) =>
    new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
  )

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12">
      <Link href={`/dashboard/groups/${groupId}`} className="text-sm font-semibold text-indigo-600 mb-8 inline-block hover:underline">
        &larr; Tillbaka till Gruppen
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-2">{game.name}</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Turnering: {game.tournament_type}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/dashboard/groups/${groupId}/games/${gameId}/leaderboard`} className="px-5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
            Leaderboard
          </Link>
          <Link href={`/dashboard/groups/${groupId}/games/${gameId}/standings`} className="px-5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex items-center gap-2">
            📊 Tabell
          </Link>
          <Link href={`/dashboard/groups/${groupId}/games/${gameId}/predictions`} className="px-5 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-semibold rounded-lg hover:border-indigo-500 transition shadow-sm flex items-center gap-2">
            Tippa Matcher
          </Link>
          <Link href={`/dashboard/groups/${groupId}/games/${gameId}/knockout`} className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
            🏆 Slutspelstips
          </Link>
          <Link href={`/dashboard/groups/${groupId}/games/${gameId}/bracket`} className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition shadow-sm flex items-center gap-2">
            🌳 Slutspelsbracket
          </Link>
          {isAdmin && (
            <Link href={`/dashboard/groups/${groupId}/games/${gameId}/admin`} className="px-5 py-2 border-2 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 font-bold rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition flex items-center gap-2">
              👑 Admin
            </Link>
          )}
        </div>
      </div>

      {matches.length > 0 ? (
        <MatchTabs matches={matches} predictionMap={predictionMap} />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-zinc-500 dark:text-zinc-400">
          Inga matcher har laddats in ännu.
        </div>
      )}
    </div>
  )
}
