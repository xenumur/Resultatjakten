import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { toggleKnockoutLock, saveActualTeams, forceRecalculateKnockoutPoints } from '../actions'
import { KNOCKOUT_ROUNDS, KNOCKOUT_ROUND_POINTS } from '@/lib/scoring/knockout'
import { countryToFlag } from '@/lib/utils/flags'
import { ToggleLockForm, ActualTeamsForm, RecalculatePointsForm } from './AdminForms'

export default async function KnockoutAdminPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id: groupId, gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return <div className="p-12 text-center text-red-500">Åtkomst nekad.</div>
  }

  const [{ data: settings }, { data: actualTeams }, { data: matches }] = await Promise.all([
    supabase.from('knockout_settings').select('*').eq('game_id', gameId).single(),
    supabase.from('knockout_actual_teams').select('round, team_name').eq('game_id', gameId),
    supabase.from('matches').select('home_team, away_team').eq('game_id', gameId),
  ])

  const isLocked = settings?.is_locked ?? false

  const allTeams = Array.from(
    new Set((matches ?? []).flatMap(m => [m.home_team, m.away_team]))
  ).filter(t => t && countryToFlag(t) !== '').sort()

  const actualByRound = new Map<string, string[]>()
  for (const at of actualTeams ?? []) {
    if (!actualByRound.has(at.round)) actualByRound.set(at.round, [])
    actualByRound.get(at.round)!.push(at.team_name)
  }

  const boundToggleLock = toggleKnockoutLock.bind(null, groupId, gameId)
  const boundSaveActual = saveActualTeams.bind(null, groupId, gameId)
  const boundForceRecalculate = forceRecalculateKnockoutPoints.bind(null, groupId, gameId)

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10">
      <Link href={`/dashboard/groups/${groupId}/games/${gameId}/knockout`} className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till Slutspelstips
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Admin: Slutspelstips</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Hantera lås och mata in faktiska kvalificerade lag per runda.</p>
        </div>

        {/* Lock toggle & Recalculate */}
        <div className="flex flex-col gap-3">
          <ToggleLockForm action={boundToggleLock} isLocked={isLocked} />
          <RecalculatePointsForm action={boundForceRecalculate} />
        </div>
      </div>

      {/* Status card */}
      <div className={`mb-8 p-5 rounded-2xl border-2 flex items-center gap-4 ${
        isLocked
          ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30'
          : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30'
      }`}>
        <span className="text-3xl">{isLocked ? '🔒' : '✅'}</span>
        <div>
          <p className={`font-black text-base ${isLocked ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {isLocked ? 'Tipsen är låsta' : 'Tipsen är öppna'}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isLocked
              ? 'Deltagarna kan inte längre ändra sina val. Du kan mata in faktiska resultat nedan.'
              : 'Deltagarna kan fortfarande ändra sina tips. Lås när slutspelet börjar.'}
          </p>
        </div>
      </div>

      {/* Actual teams form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm mb-8">
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-black text-lg text-zinc-900 dark:text-white">Faktiska lag per runda</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Fyll i vilka lag som faktiskt kvalificerat sig. Poäng räknas om automatiskt när du sparar.</p>
        </div>

        <ActualTeamsForm action={boundSaveActual}>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {KNOCKOUT_ROUNDS.map(round => {
              const currentActual = actualByRound.get(round.key) ?? []
              return (
                <div key={round.key} className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{round.emoji}</span>
                    <h3 className="font-black text-zinc-900 dark:text-white">{round.label}</h3>
                    <span className="text-xs text-zinc-400 ml-2">{round.teamCount} lag · {KNOCKOUT_ROUND_POINTS[round.key]}p/lag</span>
                    <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {currentActual.length}/{round.teamCount} inmatade
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Array.from({ length: round.teamCount }).map((_, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Plats {i + 1}</label>
                        <select
                          name={`actual_${round.key}_${i}`}
                          defaultValue={currentActual[i] ?? ''}
                          className="w-full text-sm font-semibold py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500 transition pr-8"
                        >
                          <option value="">— välj lag —</option>
                          {allTeams.map(team => (
                            <option key={team} value={team}>{countryToFlag(team)} {team}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <Save className="w-4 h-4" />
              Spara faktiska lag & beräkna poäng
            </button>
          </div>
        </ActualTeamsForm>
      </div>
    </div>
  )
}
