'use client'

import { createGroup } from './actions'
import Link from 'next/link'
import { useActionState } from 'react'

const initialState = { error: '' }

export default function CreateGroupPage() {
  const [state, formAction, isPending] = useActionState(createGroup, initialState)

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

        {state?.error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium">
            {state.error}
          </div>
        )}

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
          
          <button disabled={isPending} type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50">
            {isPending ? 'Skapar...' : 'Skapa grupp'}
          </button>
        </form>
      </div>
    </div>
  )
}
