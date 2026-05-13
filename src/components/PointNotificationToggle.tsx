'use client'

import { useState, useEffect } from 'react'
import { updateNotificationPreference, getNotificationPreference } from '@/app/dashboard/notifications/actions'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

export function PointNotificationToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getNotificationPreference().then(pref => {
      setEnabled(pref.notify_on_points_change)
    })
  }, [])

  async function handleToggle() {
    if (enabled === null) return
    
    setLoading(true)
    const newStatus = !enabled
    try {
      const result = await updateNotificationPreference(newStatus)
      if (result.success) {
        setEnabled(newStatus)
        toast.success(newStatus ? 'Poängnotiser aktiverade' : 'Poängnotiser avaktiverade')
      } else {
        toast.error('Kunde inte spara inställning')
      }
    } catch {
      toast.error('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  if (enabled === null) return <div className="h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />

  return (
    <div className={`p-5 rounded-3xl border-2 transition-all ${
      enabled
        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-700'
        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${
          enabled
            ? 'bg-indigo-100 dark:bg-indigo-800/40 text-indigo-600 dark:text-indigo-400'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
        }`}>
          {enabled ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-black text-sm uppercase tracking-tight ${
            enabled ? 'text-indigo-700 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'
          }`}>
            Poänguppdateringar
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Få en notis när din poäng eller ranking ändras i dina grupper.
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all active:scale-95 disabled:opacity-50 ${
            enabled
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20'
          }`}
        >
          {loading ? '...' : enabled ? 'Avaktivera' : 'Aktivera'}
        </button>
      </div>
    </div>
  )
}
