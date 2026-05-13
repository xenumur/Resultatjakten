'use client'

import { useActionState, useEffect } from 'react'
import { bulkUpdateMatchResults } from './actions'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { Save } from 'lucide-react'

interface BulkMatchSaveButtonProps {
  groupId: string
  gameId: string
}

export function BulkMatchSaveButton({ groupId, gameId }: BulkMatchSaveButtonProps) {
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    return await bulkUpdateMatchResults(groupId, gameId, formData)
  }, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction} id="bulk-matches-form">
      <SubmitButton 
        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl font-black transition-all shadow-lg shadow-indigo-600/20 active:scale-95 text-[10px] sm:text-xs uppercase tracking-widest"
      >
        <Save className="w-4 h-4" />
        Spara Alla Ändringar
      </SubmitButton>
    </form>
  )
}
