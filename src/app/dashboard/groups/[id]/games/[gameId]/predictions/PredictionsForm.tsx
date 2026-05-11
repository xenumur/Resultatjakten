'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { Save } from 'lucide-react'

interface PredictionsFormProps {
  action: (formData: FormData) => Promise<any>
  children: React.ReactNode
}

export function PredictionsForm({ action, children }: PredictionsFormProps) {
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await action(formData)
    return result
  }, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Klart!', {
        description: 'Dina tips har sparats framgångsrikt.'
      })
    } else if (state?.error) {
      toast.error('Ett fel uppstod', {
        description: state.error
      })
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-12">
      {children}
      
      {/* Flytande spara-knapp för mobilen (uppe till höger) */}
      <div className="md:hidden fixed top-[env(safe-area-inset-top,0px)] right-14 h-[60px] flex items-center z-[60]">
        <SubmitButton 
          type="submit" 
          className="flex items-center justify-center bg-indigo-600 text-white p-3 rounded-full shadow-lg shadow-indigo-600/30 active:scale-90 transition-all border-2 border-white dark:border-zinc-900"
          loadingText=""
        >
          <Save className="w-6 h-6" />
        </SubmitButton>
      </div>

      {/* Spara-knapp för desktop (längst ner) */}
      <div className="hidden md:flex fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 justify-center">
        <SubmitButton 
          type="submit" 
          className="w-full max-w-sm flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20"
        >
          <Save className="w-6 h-6" />
          Spara Alla Tips
        </SubmitButton>
      </div>
    </form>
  )
}
