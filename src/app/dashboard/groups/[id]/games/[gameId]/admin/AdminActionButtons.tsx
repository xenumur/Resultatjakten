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

  const baseClasses = "flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl font-black transition-all active:scale-95 text-[10px] sm:text-xs uppercase tracking-widest shadow-lg whitespace-nowrap leading-none"
  const variantClasses = variant === 'primary' 
    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20" 
    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 shadow-zinc-200/50 dark:shadow-none border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"

  return (
    <form action={formAction}>
      <SubmitButton className={`${baseClasses} ${variantClasses}`}>
        {icon}
        {label}
      </SubmitButton>
    </form>
  )
}
