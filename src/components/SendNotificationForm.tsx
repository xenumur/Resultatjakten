'use client'

import { useState, useActionState, useEffect } from 'react'
import { sendNotification } from '@/app/dashboard/notifications/actions'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { Bell } from 'lucide-react'

interface SendNotificationFormProps {
  groupId: string
}

export function SendNotificationForm({ groupId }: SendNotificationFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    return await sendNotification(groupId, title, content)
  }, null)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      setIsOpen(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-sm active:scale-95"
      >
        <Bell className="w-4 h-4" />
        Skicka Notis till alla
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Bell className="w-6 h-6 text-indigo-500" />
          Skicka ny notis
        </h2>
        
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-zinc-600 dark:text-zinc-400">Titel</label>
            <input 
              name="title" 
              required 
              placeholder="T.ex. Matchstart om 15 min!"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-zinc-600 dark:text-zinc-400">Meddelande</label>
            <textarea 
              name="content" 
              required 
              rows={4}
              placeholder="Skriv vad som händer..."
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Avbryt
            </button>
            <SubmitButton 
              className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
              loadingText="Skickar..."
            >
              Skicka Nu
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
