'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { isMatchActivelyPolling, checkMatchConflict } from '@/lib/utils/sync'
import { syncSingleMatchWithProvider } from '@/app/dashboard/groups/[id]/games/[gameId]/admin/actions'

interface Match {
  id: string
  game_id: string
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
}

interface GroupLiveSyncWatcherProps {
  matches: Match[]
  groupId: string
}

export function GroupLiveSyncWatcher({ matches, groupId }: GroupLiveSyncWatcherProps) {
  const isSyncingRef = useRef<Record<string, boolean>>({})
  const [now] = useState(() => Date.now())

  // Filtrera fram aktiva matcher som behöver övervakas
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

  // Polling-loop i bakgrunden (tyst)
  useEffect(() => {
    if (activeMatches.length === 0) return

    const runSync = async () => {
      for (const match of activeMatches) {
        if (isSyncingRef.current[match.id]) continue

        isSyncingRef.current[match.id] = true
        try {
          // Kör server action för att synka matchen
          await syncSingleMatchWithProvider(groupId, match.game_id, match.id)
        } catch (e) {
          console.error(`[Group Sync Watcher] Failed to background sync match ${match.id}:`, e)
        } finally {
          isSyncingRef.current[match.id] = false
        }
      }
    }

    // Polla var 30:e sekund
    const interval = setInterval(runSync, 30000)

    return () => clearInterval(interval)
  }, [activeMatches, groupId])

  // Denna komponent renderar ingenting i gränssnittet, den jobbar tyst i bakgrunden
  return null
}
