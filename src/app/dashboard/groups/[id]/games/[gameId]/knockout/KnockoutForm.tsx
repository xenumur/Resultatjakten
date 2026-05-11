'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { KNOCKOUT_ROUNDS } from '@/lib/scoring/knockout'
import { countryToFlag } from '@/lib/utils/flags'
import { Save, Lock } from 'lucide-react'

interface TeamPick {
  round: string
  team_name: string
}

interface KnockoutFormProps {
  action: (formData: FormData) => Promise<any>
  existingPicks: TeamPick[]
  availableTeams: string[]
  isLocked: boolean
}

export function KnockoutPredictionForm({ action, existingPicks, availableTeams, isLocked }: KnockoutFormProps) {
  const [state, formAction] = useActionState(async (_: any, formData: FormData) => {
    return await action(formData)
  }, null)

  useEffect(() => {
    if (state?.success) toast.success(state.message)
    if (state?.error) toast.error(state.error)
  }, [state])

  const picksByRound = new Map<string, string[]>()
  for (const p of existingPicks) {
    if (!picksByRound.has(p.round)) picksByRound.set(p.round, [])
    picksByRound.get(p.round)!.push(p.team_name)
  }

  return (
    <form action={formAction}>
      <div className="space-y-8">
        {KNOCKOUT_ROUNDS.map(round => {
          const picks = picksByRound.get(round.key) ?? []
          return (
            <RoundSection
              key={round.key}
              round={round}
              picks={picks}
              availableTeams={availableTeams}
              isLocked={isLocked}
            />
          )
        })}
      </div>

      {!isLocked && (
        <div className="mt-10 flex justify-center">
          <SubmitButton className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-base transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
            <Save className="w-5 h-5" />
            Spara alla slutspelstips
          </SubmitButton>
        </div>
      )}

      {isLocked && (
        <div className="mt-8 flex items-center justify-center gap-3 text-red-500 font-bold">
          <Lock className="w-5 h-5" />
          Tipsen är låsta av administratören
        </div>
      )}
    </form>
  )
}

function RoundSection({
  round,
  picks,
  availableTeams,
  isLocked,
}: {
  round: typeof KNOCKOUT_ROUNDS[number]
  picks: string[]
  availableTeams: string[]
  isLocked: boolean
}) {
  const pointsPerTeam = round.key === 'round_of_16' ? 2
    : round.key === 'quarter_final' ? 4
    : round.key === 'semi_final' ? 6
    : round.key === 'third_place' ? 8
    : 10

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{round.emoji}</span>
          <div>
            <h2 className="font-black text-lg text-zinc-900 dark:text-white">{round.label}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {round.teamCount} lag · {pointsPerTeam} poäng per rätt gissat lag
            </p>
          </div>
        </div>
        <div className="text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
          {picks.length}/{round.teamCount} valda
        </div>
      </div>

      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: round.teamCount }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Lag {i + 1}</label>
            <div className="relative">
              {picks[i] && (
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">
                  {countryToFlag(picks[i])}
                </span>
              )}
              <select
                name={`${round.key}_${i}`}
                disabled={isLocked}
                defaultValue={picks[i] ?? ''}
                className={`w-full text-sm font-semibold py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed ${picks[i] ? 'pl-8' : 'pl-3'} pr-2`}
              >
                <option value="">— välj lag —</option>
                {availableTeams.map(team => (
                  <option key={team} value={team}>{countryToFlag(team)} {team}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
