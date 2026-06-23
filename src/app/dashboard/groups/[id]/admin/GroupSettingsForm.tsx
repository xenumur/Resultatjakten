'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

interface GroupSettingsFormProps {
  groupId: string
  action: (formData: FormData) => Promise<{ success?: boolean; message?: string; error?: string } | null>
  initialData: {
    name: string
    description: string | null
    entry_fee: number | null
    currency: string | null
    payment_info: string | null
    hide_group_info: boolean | null
    hide_24h_points: boolean | null
    hide_me_badge: boolean | null
    hide_last_match_points: boolean | null
  }
}

export function GroupSettingsForm({ action, initialData }: GroupSettingsFormProps) {
  const [hideGroupInfo, setHideGroupInfo] = useState(initialData.hide_group_info || false)
  const [hide24hPoints, setHide24hPoints] = useState(initialData.hide_24h_points || false)
  const [hideMeBadge, setHideMeBadge] = useState(initialData.hide_me_badge || false)
  const [hideLastMatchPoints, setHideLastMatchPoints] = useState(initialData.hide_last_match_points || false)

  const [state, formAction] = useActionState(async (_state: { success?: boolean; message?: string; error?: string } | null, formData: FormData) => {
    return (await action(formData)) as { success?: boolean; message?: string; error?: string } | null
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

        {/* Toggle option for hiding group info */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="space-y-1 pr-4">
            <label htmlFor="hide_group_info_toggle" className="text-sm font-black uppercase tracking-widest text-zinc-400 cursor-pointer select-none">
              Dölj gruppinfo på gruppsidan
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Inaktiverar och döljer rutan med gruppens insats, betalningsinfo och rollbeskrivning längst ner på gruppsidan för alla medlemmar.
            </p>
          </div>
          <button
            id="hide_group_info_toggle"
            type="button"
            onClick={() => setHideGroupInfo(!hideGroupInfo)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              hideGroupInfo ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          >
            <span
              style={{
                transform: hideGroupInfo ? 'translateX(20px)' : 'translateX(0px)'
              }}
              className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
            />
          </button>
          <input
            type="hidden"
            name="hide_group_info"
            value={hideGroupInfo ? 'true' : 'false'}
          />
        </div>

        {/* Toggle option for hiding 24h points */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="space-y-1 pr-4">
            <label htmlFor="hide_24h_points_toggle" className="text-sm font-black uppercase tracking-widest text-zinc-400 cursor-pointer select-none">
              Dölj poängökning per matchdag
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Döljer badgen som visar intjänade poäng under den aktuella matchdagen på leaderboarden.
            </p>
          </div>
          <button
            id="hide_24h_points_toggle"
            type="button"
            onClick={() => setHide24hPoints(!hide24hPoints)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              hide24hPoints ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          >
            <span
              style={{
                transform: hide24hPoints ? 'translateX(20px)' : 'translateX(0px)'
              }}
              className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
            />
          </button>
          <input
            type="hidden"
            name="hide_24h_points"
            value={hide24hPoints ? 'true' : 'false'}
          />
        </div>

        {/* Toggle option for hiding last match points */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="space-y-1 pr-4">
            <label htmlFor="hide_last_match_points_toggle" className="text-sm font-black uppercase tracking-widest text-zinc-400 cursor-pointer select-none">
              Dölj senaste matchens poäng
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Döljer badgen bredvid namnet som visar hur många poäng deltagaren fick i den senast spelade matchen.
            </p>
          </div>
          <button
            id="hide_last_match_points_toggle"
            type="button"
            onClick={() => setHideLastMatchPoints(!hideLastMatchPoints)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              hideLastMatchPoints ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          >
            <span
              style={{
                transform: hideLastMatchPoints ? 'translateX(20px)' : 'translateX(0px)'
              }}
              className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
            />
          </button>
          <input
            type="hidden"
            name="hide_last_match_points"
            value={hideLastMatchPoints ? 'true' : 'false'}
          />
        </div>

        {/* Toggle option for hiding "Du" badge */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 transition hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="space-y-1 pr-4">
            <label htmlFor="hide_me_badge_toggle" className="text-sm font-black uppercase tracking-widest text-zinc-400 cursor-pointer select-none">
              Dölj &ldquo;Du&rdquo;-badgen
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Döljer badgen som visar &ldquo;Du&rdquo; på din egen rad i leaderboarden.
            </p>
          </div>
          <button
            id="hide_me_badge_toggle"
            type="button"
            onClick={() => setHideMeBadge(!hideMeBadge)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              hideMeBadge ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          >
            <span
              style={{
                transform: hideMeBadge ? 'translateX(20px)' : 'translateX(0px)'
              }}
              className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
            />
          </button>
          <input
            type="hidden"
            name="hide_me_badge"
            value={hideMeBadge ? 'true' : 'false'}
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
