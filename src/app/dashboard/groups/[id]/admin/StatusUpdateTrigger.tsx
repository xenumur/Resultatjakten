'use client'

import { useState } from 'react'
import { sendStatusUpdate } from './actions'
import { Bell, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface StatusUpdateTriggerProps {
  groupId: string
}

export function StatusUpdateTrigger({ groupId }: StatusUpdateTriggerProps) {
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!confirm('Vill du skicka en statusuppdatering med poäng och ranking till ALLA medlemmar i gruppen?')) {
      return
    }

    setLoading(true)
    try {
      const result = await sendStatusUpdate(groupId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error || 'Något gick fel')
      }
    } catch {
      toast.error('Ett oväntat fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Bell className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Statusuppdatering</h3>
      </div>
      
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Skicka en manuell push-notis och in-app notis till alla deltagare i gruppen. 
        Notisen innehåller deras aktuella totalpoäng och ranking på leaderboarden.
      </p>

      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-tight text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {loading ? 'Skickar...' : 'Skicka Statusuppdatering'}
      </button>
    </div>
  )
}
