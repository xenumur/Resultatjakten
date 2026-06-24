export interface MatchWithProviderInfo {
  home_team: string
  away_team: string
  status: string
  final_home_score?: number | null
  final_away_score?: number | null
  provider_home_team?: string | null
  provider_away_team?: string | null
  provider_status?: string | null
  provider_home_score?: number | null
  provider_away_score?: number | null
}

export function checkMatchConflict(match: MatchWithProviderInfo): boolean {
  const hasScoreConflict = match.provider_home_score !== null && match.provider_home_score !== undefined && (
    match.final_home_score !== match.provider_home_score ||
    match.final_away_score !== match.provider_away_score
  )
  const hasStatusConflict = !!(match.provider_status && match.status !== match.provider_status)
  const hasTeamConflict = !!(match.provider_home_team && (
    match.home_team !== match.provider_home_team ||
    match.away_team !== match.provider_away_team
  ))
  return hasScoreConflict || hasStatusConflict || hasTeamConflict
}

export interface PollingMatchInput {
  kickoff_time: string
  status: string
  disable_auto_sync: boolean
  is_manual_override?: boolean
  hasConflict?: boolean
}

export function isMatchActivelyPolling(match: PollingMatchInput, now: number): boolean {
  if (match.disable_auto_sync) return false
  const kickoff = new Date(match.kickoff_time).getTime()
  const isLiveOrRecentlyStarted = (now - kickoff >= 2 * 60 * 60 * 1000) && (match.status !== 'finished')
  const isOutOfSync = !!match.is_manual_override && !!match.hasConflict
  return isLiveOrRecentlyStarted || isOutOfSync
}
