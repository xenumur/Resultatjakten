import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Medal } from 'lucide-react'
import { calculateKnockoutLeaderboard } from '@/lib/scoring/knockout'
import { KNOCKOUT_ROUNDS } from '@/lib/scoring/knockout'

export default async function KnockoutLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id: groupId, gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: allPredictions },
    { data: actualTeams },
    { data: members },
  ] = await Promise.all([
    supabase.from('knockout_predictions').select('user_id, round, team_name, points_awarded').eq('game_id', gameId),
    supabase.from('knockout_actual_teams').select('round, team_name').eq('game_id', gameId),
    supabase.from('group_members').select('user_id, profiles:user_id(display_name, email)').eq('group_id', groupId),
  ])

  const userNames: Record<string, string> = {}
  for (const m of members ?? []) {
    const p = m.profiles as any
    userNames[m.user_id] = p?.display_name ?? p?.email ?? 'Okänd'
  }

  const hasResults = (actualTeams?.length ?? 0) > 0
  const leaderboard = calculateKnockoutLeaderboard(
    allPredictions ?? [],
    actualTeams ?? [],
    userNames,
  )

  const rankEmoji = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-10">
      <Link href={`/dashboard/groups/${groupId}/games/${gameId}/knockout`} className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till Slutspelstips
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <Medal className="w-8 h-8 text-indigo-500" />
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Leaderboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Slutspelstips – VM 2026</p>
        </div>
      </div>

      {!hasResults && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-5 mb-8 flex items-start gap-3">
          <span className="text-2xl">⏳</span>
          <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
            Inga resultat har matats in ännu. Leaderboarden uppdateras så fort admin registrerar vilka lag som gått vidare.
          </p>
        </div>
      )}

      {leaderboard.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-zinc-500">
          Inga tips har lagts än.
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className="space-y-3">
          {leaderboard.map(entry => {
            const isMe = entry.user_id === user.id
            return (
              <div
                key={entry.user_id}
                className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 flex items-center gap-5 transition ${
                  isMe
                    ? 'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {/* Rank */}
                <div className="text-2xl font-black w-10 text-center shrink-0">
                  {rankEmoji(entry.rank)}
                </div>

                {/* Avatar */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 ${
                  entry.rank === 1
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                    : isMe
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                }`}>
                  {entry.display_name[0]?.toUpperCase()}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-black text-zinc-900 dark:text-white flex items-center gap-2">
                    {entry.display_name}
                    {isMe && <span className="text-[10px] uppercase tracking-widest font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">Du</span>}
                  </div>
                  {hasResults && (
                    <div className="flex gap-3 mt-1 flex-wrap">
                      {KNOCKOUT_ROUNDS.map(r => {
                        const pts = entry.points_by_round[r.key] ?? 0
                        return (
                          <span key={r.key} className={`text-xs font-bold ${pts > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                            {r.emoji} {pts}p
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Total points */}
                <div className={`text-3xl font-black shrink-0 ${hasResults ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-300 dark:text-zinc-700'}`}>
                  {hasResults ? entry.total_points : '–'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
