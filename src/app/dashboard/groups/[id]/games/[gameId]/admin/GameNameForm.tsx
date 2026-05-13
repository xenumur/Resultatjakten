'use client'

import { useState, useActionState, useEffect } from 'react'
import { updateGameName } from './actions'
import { toast } from 'sonner'
import { Edit2, Check, X } from 'lucide-react'
import { SubmitButton } from '@/components/ui/SubmitButton'

export function GameNameForm({ groupId, gameId, initialName }: { groupId: string, gameId: string, initialName: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [state, action] = useActionState(updateGameName.bind(null, groupId, gameId), undefined)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      setIsEditing(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  if (!isEditing) {
    return (
      <div className="flex flex-col">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Admin: Matchresultat</span>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">{initialName}</h1>
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-zinc-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Byt namn på turneringen"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Admin: Matchresultat</span>
      <form action={action} className="flex items-center gap-2">
        <input 
          type="text" 
          name="name" 
          defaultValue={initialName}
          className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-sm"
          autoFocus
        />
        <SubmitButton className="flex items-center justify-center p-2.5 h-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
          <Check className="w-5 h-5" />
        </SubmitButton>
        <button 
          type="button" 
          onClick={() => setIsEditing(false)}
          className="flex items-center justify-center p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700"
        >
          <X className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}
