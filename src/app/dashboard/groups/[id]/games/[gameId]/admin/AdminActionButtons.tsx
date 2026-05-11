'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { RefreshCw } from 'lucide-react'

interface AdminActionButtonProps {
  action: (formData: FormData) => Promise<any>
  label: string
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export function AdminActionButton({ action, label, icon, variant = 'secondary' }: AdminActionButtonProps) {
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    return await action(formData)
  }, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Klart!')
    } else if (state?.error) {
      toast.error('Fel', { description: state.error })
    }
  }, [state])

  const baseClasses = "px-5 py-2 rounded-lg font-bold shadow-sm transition flex items-center gap-2"
  const variantClasses = variant === 'primary' 
    ? "bg-emerald-600 text-white hover:bg-emerald-700" 
    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"

  return (
    <form action={formAction}>
      <SubmitButton className={`${baseClasses} ${variantClasses}`}>
        {icon}
        {label}
      </SubmitButton>
    </form>
  )
}
