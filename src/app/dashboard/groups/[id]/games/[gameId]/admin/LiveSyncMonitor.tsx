'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { isMatchActivelyPolling, checkMatchConflict } from '@/lib/utils/sync'
import { RefreshCw } from 'lucide-react'

interface Match {
  id: string
  home_team: string
  away_team: string
  kickoff_time: string
  status: string
  disable_auto_sync: boolean
  is_manual_override?: boolean
  provider_home_score?: number | null
  provider_away_score?: number | null
  final_home_score?: number | null
  final_away_score?: number | null
  provider_status?: string | null
  provider_home_team?: string | null
  provider_away_team?: string | null
  game_id: string
}

interface LiveSyncMonitorProps {
  matches: Match[]
  groupId: string
  gameId: string
  syncAction: (
    groupId: string,
    gameId: string,
    matchId: string
  ) => Promise<{ success?: boolean; error?: string; message?: string }>
}

export function LiveSyncMonitor({ matches, groupId, gameId, syncAction }: LiveSyncMonitorProps) {
  const isSyncingRef = useRef<Record<string, boolean>>({})
  const [now] = useState(() => Date.now())

  // Filtrera fram aktiva matcher direkt under renderingen med useMemo för att undvika setState i en useEffect
  const activeMatches = useMemo(() => {
    return matches.filter(match => {
      const hasConflict = checkMatchConflict(match)

      return isMatchActivelyPolling({
        kickoff_time: match.kickoff_time,
        status: match.status,
        disable_auto_sync: match.disable_auto_sync,
        is_manual_override: match.is_manual_override,
        hasConflict
      }, now)
    })
  }, [matches, now])

  // Polling-loop
  useEffect(() => {
    if (activeMatches.length === 0) return

    const runSync = async () => {
      for (const match of activeMatches) {
        if (isSyncingRef.current[match.id]) continue

        isSyncingRef.current[match.id] = true
        try {
          await syncAction(groupId, gameId, match.id)
        } catch (e) {
          console.error(`Failed to background sync match ${match.id}:`, e)
        } finally {
          isSyncingRef.current[match.id] = false
        }
      }
    }

    // Polla var 30:e sekund
    const interval = setInterval(runSync, 30000)

    return () => clearInterval(interval)
  }, [activeMatches, groupId, gameId, syncAction])

  if (activeMatches.length === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 mb-6 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-250 dark:border-emerald-900/30 rounded-2xl animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <div className="text-xs text-emerald-800 dark:text-emerald-400 font-bold">
          <span>Automatisk live-synk aktiv för {activeMatches.length} {activeMatches.length === 1 ? 'match' : 'matcher'}:</span>
          <span className="ml-1.5 font-normal text-emerald-700 dark:text-emerald-500">
            {activeMatches.map(m => `${m.home_team} - ${m.away_team}`).join(', ')}
          </span>
        </div>
      </div>
      <div className="text-[10px] uppercase font-black tracking-widest text-emerald-650 dark:text-emerald-500 flex items-center gap-1.5 leading-none">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Hämtar data var 30:e sek
      </div>
    </div>
  )
}
