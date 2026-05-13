'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Calendar, Clock } from 'lucide-react'
import { addDeadline, deleteDeadline } from './actions'

interface Deadline {
  id: string
  title: string
  deadline_at: string
}

interface DeadlineManagementProps {
  groupId: string
  initialDeadlines: Deadline[]
}

export function DeadlineManagement({ groupId, initialDeadlines }: DeadlineManagementProps) {
  const [isAdding, setIsAdding] = useState(false)
  
  const [state, formAction, isPending] = useActionState(async (_: any, formData: FormData) => {
    const res = await addDeadline(groupId, formData)
    if (res?.success) {
      setIsAdding(false)
      toast.success('Deadline tillagd!')
    }
    if (res?.error) toast.error(res.error)
    return res
  }, null)

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna deadline?')) return
    const res = await deleteDeadline(groupId, id)
    if (res?.success) toast.success('Deadline borttagen!')
    if (res?.error) toast.error(res.error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl font-black text-zinc-900 dark:text-white">Deadlines</h2>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md shadow-indigo-600/10"
          >
            <Plus className="w-4 h-4" />
            Ny deadline
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm">
        {isAdding && (
          <form action={formAction} className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Namn på deadline</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="t.ex. Slutspelstips stänger"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="deadline_at" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Datum & Tid</label>
                <input
                  id="deadline_at"
                  name="deadline_at"
                  type="datetime-local"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-3 rounded-2xl font-black text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-3 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-2xl font-black text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? 'Sparar...' : 'Spara deadline'}
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {initialDeadlines.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 italic text-sm">
              Inga deadlines skapade ännu.
            </div>
          ) : (
            initialDeadlines.map((d) => (
              <div key={d.id} className="p-5 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white">{d.title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(d.deadline_at).toLocaleString('sv-SE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="Ta bort"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
