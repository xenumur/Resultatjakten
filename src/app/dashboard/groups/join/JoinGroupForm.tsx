'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { useRouter } from 'next/navigation'

interface JoinGroupFormProps {
  action: (formData: FormData) => Promise<any>
}

export function JoinGroupForm({ action }: JoinGroupFormProps) {
  const router = useRouter()
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await action(formData)
    return result
  }, null)

  useEffect(() => {
    if (state?.success) {
      toast.success('Välkommen!', {
        description: 'Du har gått med i gruppen.'
      })
      if (state.redirect) {
        router.push(state.redirect)
      }
    } else if (state?.error) {
      toast.error('Kunde inte gå med', {
        description: state.error
      })
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
          Inbjudningskod
        </label>
        <input 
          name="joinCode" 
          required 
          placeholder="T.ex. AB12CD"
          className="w-full uppercase px-4 py-3 text-lg font-mono tracking-widest rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>
      
      <SubmitButton className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md">
        Gå med i gruppen
      </SubmitButton>
    </form>
  )
}
