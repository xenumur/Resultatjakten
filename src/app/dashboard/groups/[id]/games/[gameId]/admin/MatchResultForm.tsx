'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/ui/SubmitButton'

interface MatchResultFormProps {
  matchId: string
  homeScore: number | null
  awayScore: number | null
  status: string
}

export function MatchResultForm({ matchId, homeScore, awayScore, status }: MatchResultFormProps) {
  return (
    <>
      <td className="p-4">
        <div className="flex gap-2 items-center">
          <input 
            form="bulk-matches-form"
            type="number" 
            name={`${matchId}_homeScore`} 
            defaultValue={homeScore ?? ''} 
            className="w-12 h-10 text-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-zinc-400">-</span>
          <input 
            form="bulk-matches-form"
            type="number" 
            name={`${matchId}_awayScore`} 
            defaultValue={awayScore ?? ''} 
            className="w-12 h-10 text-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </td>
      <td className="p-4">
        <select 
          form="bulk-matches-form"
          name={`${matchId}_status`} 
          defaultValue={status} 
          className="text-sm px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="upcoming">Kommande</option>
          <option value="live">Live</option>
          <option value="finished">Avslutad</option>
        </select>
      </td>
    </>
  )
}
