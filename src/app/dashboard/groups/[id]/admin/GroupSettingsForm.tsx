'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

interface GroupSettingsFormProps {
  groupId: string
  action: (formData: FormData) => Promise<any>
  initialData: {
    name: string
    description: string | null
    entry_fee: number | null
    currency: string | null
    payment_info: string | null
  }
}

export function GroupSettingsForm({ groupId, action, initialData }: GroupSettingsFormProps) {
  const [state, formAction] = useActionState(async (_: any, formData: FormData) => {
    return await action(formData)
  }, null)

  useEffect(() => {
    if (state?.success) toast.success(state.message)
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="name" className="text-sm font-black uppercase tracking-widest text-zinc-400">Gruppnamn</label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={initialData.name}
            required
            className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="description" className="text-sm font-black uppercase tracking-widest text-zinc-400">Beskrivning</label>
          <textarea
            id="description"
            name="description"
            defaultValue={initialData.description || ''}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label htmlFor="entry_fee" className="text-sm font-black uppercase tracking-widest text-zinc-400">Insats</label>
            <input
              id="entry_fee"
              name="entry_fee"
              type="number"
              step="0.01"
              defaultValue={initialData.entry_fee || 0}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="currency" className="text-sm font-black uppercase tracking-widest text-zinc-400">Valuta</label>
            <input
              id="currency"
              name="currency"
              type="text"
              defaultValue={initialData.currency || 'SEK'}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor="payment_info" className="text-sm font-black uppercase tracking-widest text-zinc-400">Betalning till (t.ex. Swish-nummer)</label>
          <input
            id="payment_info"
            name="payment_info"
            type="text"
            placeholder="Mottagare eller Swish-nummer..."
            defaultValue={initialData.payment_info || ''}
            className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
        >
          <Save className="w-5 h-5" />
          Spara ändringar
        </button>
      </div>
    </form>
  )
}
