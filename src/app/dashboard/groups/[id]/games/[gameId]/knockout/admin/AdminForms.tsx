'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Lock, Unlock, Save } from 'lucide-react'

interface ActionResponse {
  success?: boolean
  error?: string
  message?: string
}

export function ToggleLockForm({ 
  action, 
  isLocked 
}: { 
  action: (formData: FormData) => Promise<ActionResponse>, 
  isLocked: boolean 
}) {
  const [state, formAction] = useActionState(async (_: any, formData: FormData) => {
    return await action(formData)
  }, null)

  useEffect(() => {
    if (state?.success) toast.success(isLocked ? 'Tipsen har låsts upp!' : 'Tipsen har låsts!')
    if (state?.error) toast.error(state.error)
  }, [state, isLocked])

  return (
    <form action={formAction}>
      <button
        type="submit"
        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 ${
          isLocked
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
        }`}
      >
        {isLocked ? <><Lock className="w-4 h-4" /> Låst – Klicka för att låsa upp</> : <><Unlock className="w-4 h-4" /> Öppet – Klicka för att låsa</>}
      </button>
    </form>
  )
}

export function ActualTeamsForm({
  action,
  children
}: {
  action: (formData: FormData) => Promise<ActionResponse>,
  children: React.ReactNode
}) {
  const [state, formAction] = useActionState(async (_: any, formData: FormData) => {
    return await action(formData)
  }, null)

  useEffect(() => {
    if (state?.success) toast.success(state.message || 'Faktiska lag har sparats!')
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction}>
      {children}
    </form>
  )
}
