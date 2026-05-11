'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/ui/SubmitButton'

interface MatchResultFormProps {
  action: (formData: FormData) => Promise<any>
  matchId: string
  homeScore: number | null
  awayScore: number | null
  status: string
}

export function MatchResultForm({ action, matchId, homeScore, awayScore, status }: MatchResultFormProps) {
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    return await action(formData)
  }, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Sparat!')
    } else if (state?.error) {
      toast.error('Fel', { description: state.error })
    }
  }, [state])

  return (
    <>
      <form action={formAction} id={`form-${matchId}`} className="hidden" />
      
      <td className="p-4">
        <div className="flex gap-2 items-center">
          <input 
            form={`form-${matchId}`}
            type="number" 
            name="homeScore" 
            defaultValue={homeScore ?? ''} 
            className="w-12 h-10 text-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-zinc-400">-</span>
          <input 
            form={`form-${matchId}`}
            type="number" 
            name="awayScore" 
            defaultValue={awayScore ?? ''} 
            className="w-12 h-10 text-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </td>
      <td className="p-4">
        <select 
          form={`form-${matchId}`}
          name="status" 
          defaultValue={status} 
          className="text-sm px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="upcoming">Kommande</option>
          <option value="live">Live</option>
          <option value="finished">Avslutad</option>
        </select>
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-2">
          <SubmitButton 
            form={`form-${matchId}`}
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition shadow-sm"
          >
            Spara
          </SubmitButton>
        </div>
      </td>
    </>
  )
}
