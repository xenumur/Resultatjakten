'use client'

import { useActionState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/ui/SubmitButton'

interface SyncMatchResult {
  success?: boolean
  message?: string
  error?: string
}

interface SyncMatchButtonProps {
  syncAction: (formData: FormData) => Promise<SyncMatchResult>
}

export function SyncMatchButton({ syncAction }: SyncMatchButtonProps) {
  const [state, formAction] = useActionState(async (_prevState: unknown, formData: FormData) => {
    return await syncAction(formData)
  }, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Matchen har synkats!')
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction}>
      <SubmitButton 
        title="Synka denna match med API" 
        type="submit" 
        loadingText=""
        className="flex items-center justify-center text-sm bg-indigo-50 hover:bg-indigo-500 hover:text-white text-indigo-600 dark:bg-zinc-800 dark:hover:bg-indigo-900/40 dark:text-indigo-400 p-2.5 rounded-xl transition-all active:scale-95" 
      >
        <RefreshCw className="w-4 h-4" />
      </SubmitButton>
    </form>
  )
}
