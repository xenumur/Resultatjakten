import { formatInTimeZone } from 'date-fns-tz'

const TIMEZONE = 'Europe/Stockholm'
const BROADCAST_OFFSET_MS = 10 * 60 * 60 * 1000 // 10 timmar i millisekunder

/**
 * Returnerar det logiska matchdagsdatumet (YYYY-MM-DD) för en given avsparkstid.
 * Genom att dra av 10 timmar kan vi gruppera sena USA-kvällsmatcher (som spelas nattetid/morgon i Sverige)
 * till samma logiska speldag.
 */
export function getLogicalMatchday(kickoffTime: string | Date): string {
  const date = new Date(kickoffTime)
  const adjusted = new Date(date.getTime() - BROADCAST_OFFSET_MS)
  return formatInTimeZone(adjusted, TIMEZONE, 'yyyy-MM-dd')
}

/**
 * Formaterar en logisk matchdagssträng (YYYY-MM-DD) till en användarvänlig svensk etikett.
 * Returnerar "idag", "igår", eller t.ex. "24 jun".
 */
export function formatLogicalMatchdayLabel(logicalDateStr: string): string {
  const now = new Date()
  const todayStr = formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd')
  const yesterdayStr = formatInTimeZone(new Date(now.getTime() - 24 * 60 * 60 * 1000), TIMEZONE, 'yyyy-MM-dd')
  
  if (logicalDateStr === todayStr) return 'idag'
  if (logicalDateStr === yesterdayStr) return 'igår'
  
  // Lägg till T12:00:00 för att undvika DST-skiften när vi skapar datumobjektet
  const date = new Date(`${logicalDateStr}T12:00:00`)
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  return `${date.getDate()} ${months[date.getMonth()]}`
}
