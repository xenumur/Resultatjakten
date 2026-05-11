'use client'

import { createGroup } from './actions'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { useRouter } from 'next/navigation'

const initialState = { error: '', redirect: '', success: false } as any

export default function CreateGroupPage() {
  const router = useRouter()
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    return await createGroup(prevState, formData)
  }, initialState)

  useEffect(() => {
    if (state?.redirect) {
      toast.success('Gruppen har skapats!', {
        description: 'Bjud in dina vänner nu.'
      })
      router.push(state.redirect)
    } else if (state?.error) {
      toast.error('Kunde inte skapa grupp', {
        description: state.error
      })
    }
  }, [state, router])

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12">
      <Link href="/dashboard" className="text-sm font-semibold text-indigo-600 mb-8 inline-block hover:underline">
        &larr; Tillbaka till Dashboard
      </Link>
      
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Skapa ny grupp</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          Du blir automatiskt admin för gruppen och kan därefter bjuda in vänner.
        </p>

        <form className="space-y-6" action={formAction}>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Gruppens namn
            </label>
            <input 
              name="name" 
              required 
              placeholder="T.ex. Företagstipset 2026"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Beskrivning
            </label>
            <textarea 
              name="description" 
              rows={3}
              placeholder="Regler eller allmän info"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Insats per deltagare (SEK)
            </label>
            <input 
              name="entryFee" 
              type="number"
              min="0"
              defaultValue="0"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <SubmitButton className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">
            Skapa grupp
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}
