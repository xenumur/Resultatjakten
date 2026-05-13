'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/ui/SubmitButton'

interface MatchResultFormProps {
  matchId: string
  homeScore: number | null
  awayScore: number | null
  status: string
  homeTeam: string
  awayTeam: string
  stage: string | null
  teams?: string[]
}

export function MatchResultForm({ 
  matchId, 
  homeScore, 
  awayScore, 
  status,
  homeTeam,
  awayTeam,
  stage,
  teams = []
}: MatchResultFormProps) {
  const isKnockout = stage && (
    stage.toLowerCase().includes('round') || 
    stage.toLowerCase().includes('final') || 
    stage.toLowerCase().includes('quarter') || 
    stage.toLowerCase().includes('semi') ||
    stage.toLowerCase().includes('third place') ||
    stage.toLowerCase().includes('play-off')
  );

  return (
    <>
      <td className="p-4">
        {isKnockout ? (
          <div className="flex flex-col gap-2 min-w-[200px]">
            <select 
              form="bulk-matches-form"
              name={`${matchId}_homeTeam`} 
              defaultValue={homeTeam} 
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            >
              <option value="">Välj hemmalag...</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
              {!teams.includes(homeTeam) && homeTeam && (
                <option value={homeTeam}>{homeTeam}</option>
              )}
            </select>
            <select 
              form="bulk-matches-form"
              name={`${matchId}_awayTeam`} 
              defaultValue={awayTeam} 
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            >
              <option value="">Välj bortalag...</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
              {!teams.includes(awayTeam) && awayTeam && (
                <option value={awayTeam}>{awayTeam}</option>
              )}
            </select>
          </div>
        ) : (
          <div className="font-bold text-zinc-900 dark:text-zinc-100">{homeTeam} - {awayTeam}</div>
        )}
      </td>
      <td className="p-4">
        <div className="flex gap-2 items-center">
          <input 
            form="bulk-matches-form"
            type="number" 
            name={`${matchId}_homeScore`} 
            defaultValue={homeScore ?? ''} 
            className="w-12 h-10 text-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-indigo-600 dark:text-indigo-400"
          />
          <span className="text-zinc-400">-</span>
          <input 
            form="bulk-matches-form"
            type="number" 
            name={`${matchId}_awayScore`} 
            defaultValue={awayScore ?? ''} 
            className="w-12 h-10 text-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-indigo-600 dark:text-indigo-400"
          />
        </div>
      </td>
      <td className="p-4">
        <select 
          form="bulk-matches-form"
          name={`${matchId}_status`} 
          defaultValue={status} 
          className="text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-black uppercase tracking-tight transition-all"
        >
          <option value="upcoming">Kommande</option>
          <option value="live">Live</option>
          <option value="finished">Avslutad</option>
        </select>
      </td>
    </>
  )
}
