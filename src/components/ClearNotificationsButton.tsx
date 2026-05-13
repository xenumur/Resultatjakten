'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { clearNotifications } from '@/app/dashboard/notifications/actions'
import { useRouter } from 'next/navigation'

export function ClearNotificationsButton({ hasNotifications }: { hasNotifications: boolean }) {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  if (!hasNotifications) return null

  const handleClear = async () => {
    if (!confirm('Är du säker på att du vill rensa alla notiser?')) return
    
    setIsPending(true)
    try {
      await clearNotifications()
      router.refresh()
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      onClick={handleClear}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
      title="Rensa alla notiser"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
      )}
      <span>Rensa</span>
    </button>
  )
}
