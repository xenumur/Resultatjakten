import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'

const TIMEZONE = 'Europe/Stockholm'
import { countryToFlag } from '@/lib/utils/flags'

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

  const matchesByGroup = matches.reduce((acc: any, match: any) => {
    const key = match.group_name || match.stage || 'Övrigt';
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

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
        <div className="space-y-12">
          {Object.entries(matchesByGroup).map(([groupName, groupMatches]: [string, any]) => (
            <div key={groupName} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <h2 className="font-bold text-lg">{groupName}</h2>
              </div>
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {groupMatches.map((match: any) => {
                  const prediction = predictionMap.get(match.id);
                  return (
                  <li key={match.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:justify-between gap-6">
                    <div className="flex flex-col items-center md:items-start w-full md:w-auto">
                      <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-2">
                        {formatInTimeZone(new Date(match.kickoff_time), TIMEZONE, 'yyyy-MM-dd HH:mm')} {match.venue && `• ${match.venue}`}
                        {match.broadcaster && (
                          <span className="ml-2 px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded text-[10px] font-black uppercase tracking-tighter border border-zinc-200 dark:border-zinc-700">
                            {match.broadcaster}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4 text-base md:text-lg font-bold">
                        <span className="w-28 md:w-40 text-right flex items-center justify-end gap-2">
                          {match.home_team}
                          <span className="text-xl md:text-2xl shrink-0">{countryToFlag(match.home_team)}</span>
                        </span>
                        <span className="px-2 md:px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-500 text-xs md:text-sm shrink-0">vs</span>
                        <span className="w-28 md:w-40 text-left flex items-center justify-start gap-2">
                          <span className="text-xl md:text-2xl shrink-0">{countryToFlag(match.away_team)}</span>
                          {match.away_team}
                        </span>
                      </div>
                      {prediction && (
                        <div className="mt-3 inline-block bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-4 py-1.5 rounded-xl text-xs md:text-sm font-bold border border-indigo-100 dark:border-indigo-800/50">
                          Ditt tips: {prediction.predicted_home_score} - {prediction.predicted_away_score}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center shrink-0">
                      {match.status === 'upcoming' ? (
                         <span className="px-4 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] md:text-xs font-black rounded-full uppercase tracking-widest">Kommande</span>
                      ) : match.status === 'live' ? (
                         <span className="px-4 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] md:text-xs font-black rounded-full uppercase tracking-widest animate-pulse">Live</span>
                      ) : (
                         <div className="text-center font-black text-xl md:text-2xl bg-zinc-100 dark:bg-zinc-800 px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm min-w-[100px]">
                           {match.final_home_score} - {match.final_away_score}
                         </div>
                      )}
                    </div>
                  </li>
                )})}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-zinc-500 dark:text-zinc-400">
          Inga matcher har laddats in ännu. 
        </div>
      )}
    </div>
  )
}
