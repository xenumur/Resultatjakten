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
    </form>
  )
}
