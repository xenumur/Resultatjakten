'use client'

import Link from 'next/link'
import { createGame } from './actions'
import { useActionState, useEffect, useState } from 'react'
import { SubmitButton } from '@/components/ui/SubmitButton'

const initialState = { error: '' } as any

export default function CreateGamePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [groupId, setGroupId] = useState<string>('')
  
  useEffect(() => {
    params.then(p => setGroupId(p.id))
  }, [params])

  const createGameWithGroup = createGame.bind(null, groupId)
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    return await createGameWithGroup(prevState, formData)
  }, initialState)

  if (!groupId) return null

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12">
      <Link href={`/dashboard/groups/${groupId}`} className="text-sm font-semibold text-indigo-600 mb-8 inline-block hover:underline">
        &larr; Tillbaka till Gruppen
      </Link>
      
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Skapa ett Spel</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          Välj vilken turnering ni ska tippa på. Matcherna hämtas automatiskt via vald datakälla.
        </p>

        {state?.error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium">
            {state.error}
          </div>
        )}

        <form className="space-y-6" action={formAction}>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Spelets namn
            </label>
            <input 
              name="name" 
              required 
              placeholder="T.ex. VM 2026 Tips!"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Välj Turnering
            </label>
            <select 
              name="tournamentId" 
              required
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="wc-2026">Fotbolls-VM 2026</option>
            </select>
          </div>

          <input type="hidden" name="providerId" value="open_football" />
          
          <SubmitButton className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md" loadingText="Laddar ner matcher...">
            Skapa spel & Importera matcher
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}
