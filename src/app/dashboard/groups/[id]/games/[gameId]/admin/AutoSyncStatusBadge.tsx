'use client'

import { useTransition, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AutoSyncStatusBadgeProps {
  groupId: string
  gameId: string
  matchId: string
  disableAutoSync: boolean
  kickoffTime: string
  status: string
  isManualOverride: boolean
  hasConflict: boolean
  toggleAction: (
    groupId: string,
    gameId: string,
    matchId: string,
    currentDisabledState: boolean
  ) => Promise<{ success?: boolean; error?: string; message?: string }>
}

export function isMatchActivelyPolling(
  match: {
    kickoff_time: string
    status: string
    disable_auto_sync: boolean
    is_manual_override?: boolean
    hasConflict?: boolean
  },
  now: number
) {
  if (match.disable_auto_sync) return false

  const kickoff = new Date(match.kickoff_time).getTime()

  // Kriterie 1: Matchen startade för minst 2 timmar sedan och är inte markerad som avslutad
  const isLiveOrRecentlyStarted = (now - kickoff >= 2 * 60 * 60 * 1000) && (match.status !== 'finished')

  // Kriterie 2: Matchen har manuell override men är out-of-sync med API:et (konflikt)
  const isOutOfSync = !!match.is_manual_override && !!match.hasConflict

  return isLiveOrRecentlyStarted || isOutOfSync
}

export function AutoSyncStatusBadge({
  groupId,
  gameId,
  matchId,
  disableAutoSync,
  kickoffTime,
  status,
  isManualOverride,
  hasConflict,
  toggleAction
}: AutoSyncStatusBadgeProps) {
  const [isPending, startTransition] = useTransition()
  const [now] = useState(() => Date.now())

  const isActivelyPolling = isMatchActivelyPolling({
    kickoff_time: kickoffTime,
    status,
    disable_auto_sync: disableAutoSync,
    is_manual_override: isManualOverride,
    hasConflict
  }, now)

  const isUpcoming = new Date(kickoffTime).getTime() > now
  const isFinishedAndInSync = status === 'finished' && !hasConflict

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleAction(groupId, gameId, matchId, disableAutoSync)
      if (res.success) {
        toast.success(res.message || 'Inställningen har uppdaterats!')
      } else if (res.error) {
        toast.error(res.error)
      }
    })
  }

  // Bestäm färger och texter baserat på status
  let badgeStyles = ''
  let dotStyles = ''
  let text = ''
  let title = ''

  if (disableAutoSync) {
    badgeStyles = 'border-red-200 bg-red-50 text-red-750 dark:border-red-900/30 dark:bg-red-950/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/20'
    dotStyles = 'bg-red-500'
    text = 'Synk inaktiv'
    title = 'Automatisk synkronisering är avstängd för denna match. Klicka för att aktivera.'
  } else if (isActivelyPolling) {
    badgeStyles = 'border-emerald-250 bg-emerald-50 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/20'
    dotStyles = 'bg-emerald-500 animate-pulse'
    text = 'Bevakas (30s)'
    title = 'Matchen bevakas aktivt och uppdateras var 30:e sekund. Klicka för att stänga av.'
  } else if (isFinishedAndInSync) {
    badgeStyles = 'border-zinc-200 bg-zinc-50 text-zinc-650 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
    dotStyles = 'bg-zinc-400'
    text = 'Synkad & klar'
    title = 'Matchen är avslutad och i synk med API. Klicka för att stänga av framtida synk.'
  } else if (isUpcoming) {
    badgeStyles = 'border-blue-200 bg-blue-50 text-blue-850 dark:border-blue-900/30 dark:bg-blue-950/10 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/20'
    dotStyles = 'bg-blue-500'
    text = 'Schemalagd'
    title = 'Matchen startar i framtiden. Synk startar automatiskt vid matchslut. Klicka för att stänga av.'
  } else {
    badgeStyles = 'border-amber-250 bg-amber-50 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/10 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/20'
    dotStyles = 'bg-amber-500'
    text = 'Match startad'
    title = 'Matchen har startat. Bevakning startar 2h från kickoff. Klicka för att stänga av.'
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${badgeStyles}`}
    >
      {isPending ? (
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles}`} />
      )}
      <span>{text}</span>
    </button>
  )
}
