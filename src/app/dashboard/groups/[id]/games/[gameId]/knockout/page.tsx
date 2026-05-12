import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Lock } from 'lucide-react'
import { KnockoutPredictionForm } from './KnockoutForm'
import { saveKnockoutPredictions, ensureKnockoutSettings } from './actions'
import { KNOCKOUT_ROUNDS, KNOCKOUT_ROUND_POINTS } from '@/lib/scoring/knockout'
import { countryToFlag } from '@/lib/utils/flags'

export default async function KnockoutPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id: groupId, gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ensure settings row exists
  await ensureKnockoutSettings(gameId)

  const [{ data: game }, { data: member }, { data: settings }, { data: matches }] = await Promise.all([
    supabase.from('games').select('name, tournament_type').eq('id', gameId).single(),
    supabase.from('group_members').select('role').eq('group_id', groupId).eq('user_id', user.id).single(),
    supabase.from('knockout_settings').select('*').eq('game_id', gameId).single(),
    supabase.from('matches').select('home_team, away_team').eq('game_id', gameId),
  ])

  if (!member) redirect('/dashboard')

  const isLocked = settings?.is_locked ?? false
  const isAdmin = member.role === 'admin'

  // Get available teams from matches (unique, no placeholders)
  const allTeams = Array.from(
    new Set((matches ?? []).flatMap(m => [m.home_team, m.away_team]))
  ).filter(t => t && countryToFlag(t) !== '').sort()

  // Get this user's existing picks
  const { data: myPicks } = await supabase
    .from('knockout_predictions')
    .select('round, team_name, points_awarded')
    .eq('user_id', user.id)
    .eq('game_id', gameId)

  // Get actual teams for showing correctness (automated from matches)
  const stageMap: Record<string, string> = {
    'Round of 32': 'round_of_32',
    'Round of 16': 'round_of_16',
    'Quarter-final': 'quarter_final',
    'Semi-final': 'semi_final',
    'Match for third place': 'third_place',
    'Final': 'final'
  }

  const isPlaceholder = (name: string) => {
    if (!name) return true
    const n = name.toLowerCase()
    return n.includes('winner') || n.includes('loser') || n.includes('tbd') || /^w\d+$/.test(n) || /^l\d+$/.test(n) || n.includes('match')
  }

  const actualByRound = new Map<string, Set<string>>()
  for (const m of matches ?? []) {
    const internalKey = stageMap[m.stage]
    if (!internalKey) continue
    if (!actualByRound.has(internalKey)) actualByRound.set(internalKey, new Set())
    
    if (m.home_team && !isPlaceholder(m.home_team)) {
      actualByRound.get(internalKey)!.add(m.home_team.toLowerCase().trim())
    }
    if (m.away_team && !isPlaceholder(m.away_team)) {
      actualByRound.get(internalKey)!.add(m.away_team.toLowerCase().trim())
    }
  }

  const totalPoints = (myPicks ?? []).reduce((sum, p) => sum + (p.points_awarded ?? 0), 0)
  const hasResults = actualByRound.size > 0

  const boundSave = saveKnockoutPredictions.bind(null, groupId, gameId)

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10">
      {/* Header */}
      <Link href={`/dashboard/groups/${groupId}/games/${gameId}`} className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till Spelet
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏆</span>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
              Slutspelstips
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-base">
            Välj vilka lag du tror tar sig igenom varje slutspelsrunda i VM 2026.
          </p>
        </div>

        <div className="flex gap-3">
          {hasResults && (
            <div className="flex flex-col items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/20">
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Dina poäng</span>
              <span className="text-3xl font-black">{totalPoints}</span>
            </div>
          )}
          <Link
            href={`/dashboard/groups/${groupId}/games/${gameId}/knockout/leaderboard`}
            className="flex items-center gap-2 px-5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </Link>
          {isAdmin && (
            <Link
              href={`/dashboard/groups/${groupId}/games/${gameId}/knockout/admin`}
              className="flex items-center gap-2 px-5 py-2 border-2 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-bold rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
            >
              👑 Admin
            </Link>
          )}
        </div>
      </div>

      {/* Points guide */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KNOCKOUT_ROUNDS.map(r => (
          <div key={r.key} className="flex flex-col items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-center">
            <span className="text-xl mb-1">{r.emoji}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{r.label}</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{KNOCKOUT_ROUND_POINTS[r.key]}p</span>
            <span className="text-[10px] text-zinc-400">per lag</span>
          </div>
        ))}
      </div>

      {/* Results summary if scoring has started */}
      {hasResults && myPicks && myPicks.length > 0 && (
        <div className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 rounded-3xl p-6">
          <h2 className="font-black text-lg text-indigo-900 dark:text-indigo-200 mb-4">📊 Din poängöversikt</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {KNOCKOUT_ROUNDS.map(r => {
              const myRoundPicks = (myPicks ?? []).filter(p => p.round === r.key)
              const correct = myRoundPicks.filter(p => {
                const actual = actualByRound.get(r.key)
                return actual?.has(p.team_name.toLowerCase().trim())
              }).length
              const total = myRoundPicks.length
              return (
                <div key={r.key} className="bg-white/70 dark:bg-zinc-900/50 rounded-xl p-3 text-center">
                  <span className="text-lg">{r.emoji}</span>
                  <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mt-1">{r.label}</div>
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{correct}/{total}</div>
                  <div className="text-xs text-zinc-500">rätt</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Picked teams review (when locked) */}
      {isLocked && myPicks && myPicks.length > 0 && (
        <div className="mb-10 space-y-6">
          {KNOCKOUT_ROUNDS.map(round => {
            const picks = (myPicks ?? []).filter(p => p.round === round.key)
            if (picks.length === 0) return null
            const actual = actualByRound.get(round.key)
            return (
              <div key={round.key} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
                <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                  <span>{round.emoji}</span>
                  <span className="font-black text-zinc-900 dark:text-white">{round.label}</span>
                  <span className="ml-auto text-xs font-bold text-zinc-400">{KNOCKOUT_ROUND_POINTS[round.key]}p/lag</span>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {picks.map(p => {
                    const isCorrect = actual ? actual.has(p.team_name.toLowerCase().trim()) : null
                    return (
                      <div
                        key={p.team_name}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border ${
                          isCorrect === true
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                            : isCorrect === false
                            ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 line-through opacity-60'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {countryToFlag(p.team_name)} {p.team_name}
                        {isCorrect === true && <span className="ml-1">✓</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Prediction form (when not locked) */}
      {!isLocked && (
        <KnockoutPredictionForm
          action={boundSave}
          existingPicks={myPicks ?? []}
          availableTeams={allTeams}
          isLocked={isLocked}
        />
      )}
    </div>
  )
}
