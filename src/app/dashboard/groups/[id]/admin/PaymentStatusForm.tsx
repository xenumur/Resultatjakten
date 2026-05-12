'use client'

import { useActionState, useEffect, useState } from 'react'
import { updatePaymentStatus } from './actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface PaymentStatusFormProps {
  groupId: string
  userId: string
  initialStatus: string
}

export function PaymentStatusForm({ groupId, userId, initialStatus }: PaymentStatusFormProps) {
  const [isPending, setIsPending] = useState(false)
  
  const handleAction = async (formData: FormData) => {
    setIsPending(true)
    try {
      await updatePaymentStatus(groupId, userId, formData)
      toast.success('Betalstatus uppdaterad')
    } catch (error) {
      toast.error('Kunde inte uppdatera status')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form action={handleAction} className="flex items-center gap-2">
      <select 
        name="status" 
        defaultValue={initialStatus}
        disabled={isPending}
        className="text-xs font-bold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50"
      >
        <option value="pending">Väntar</option>
        <option value="paid">Betald</option>
      </select>
      <button 
        type="submit" 
        disabled={isPending}
        className="text-xs font-black bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-xl hover:opacity-80 transition active:scale-95 disabled:opacity-50 min-w-[70px] flex items-center justify-center"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Spara'}
      </button>
    </form>
  )
}
