import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Coins, Target, Users, Medal, Calendar, Clock, Tv, Flame } from 'lucide-react'
import { DeadlineCountdown } from '@/components/DeadlineCountdown'
import { countryToFlag } from '@/lib/utils/flags'
import { formatInTimeZone } from 'date-fns-tz'
import { getLogicalMatchday, formatLogicalMatchdayLabel } from '@/lib/utils/time'
import { LeaderboardClient } from './LeaderboardClient'
const TIMEZONE = 'Europe/Stockholm'

function formatKickoffTime(isoString: string) {
  const matchDate = new Date(isoString)
  const now = new Date()
  const todayStr = formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd')
  const tomorrowStr = formatInTimeZone(new Date(now.getTime() + 24 * 60 * 60 * 1000), TIMEZONE, 'yyyy-MM-dd')
  const matchDayStr = formatInTimeZone(matchDate, TIMEZONE, 'yyyy-MM-dd')
  
  const timeStr = formatInTimeZone(matchDate, TIMEZONE, 'HH:mm')
  
  if (matchDayStr === todayStr) {
    return `Idag ${timeStr}`
  } else if (matchDayStr === tomorrowStr) {
    return `Imorgon ${timeStr}`
  } else {
    const day = formatInTimeZone(matchDate, TIMEZONE, 'd')
    const monthIndex = parseInt(formatInTimeZone(matchDate, TIMEZONE, 'M')) - 1
    const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
    return `${day} ${months[monthIndex]} ${timeStr}`
  }
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const groupId = resolvedParams.id;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: group },
    { data: members },
    { data: matchPredictions },
    { data: knockoutPredictions },
    { data: games },
    { data: bonusAnswers },
    { data: deadlines }
  ] = await Promise.all([
    supabase.from('groups').select('*').eq('id', groupId).single(),
    supabase.from('group_members').select('*, profiles:user_id(display_name, email)').eq('group_id', groupId),
    supabase.from('predictions').select('user_id, points_awarded, match_id, updated_at').eq('group_id', groupId),
    supabase.from('knockout_predictions').select('user_id, points_awarded, updated_at').eq('group_id', groupId),
    supabase.from('games').select('*').eq('group_id', groupId),
    supabase.from('bonus_answers').select('user_id, points_awarded, graded_at, bonus_questions!inner(group_id)').eq('bonus_questions.group_id', groupId),
    supabase.from('group_deadlines').select('*').eq('group_id', groupId).order('deadline_at', { ascending: true })
  ])

  // Hämta alla matcher och turneringsstatistik för gruppens spel
  const gameIds = (games || []).map(g => g.id)
  
  const [matchesResult, goalsResult] = gameIds.length > 0
    ? await Promise.all([
        supabase
          .from('matches')
          .select('*')
          .in('game_id', gameIds)
          .order('kickoff_time', { ascending: true }),
        supabase
          .from('match_goals')
          .select('player_name, team_name, is_own_goal, matches!inner(game_id)')
          .in('matches.game_id', gameIds)
      ])
    : [{ data: [] }, { data: [] }]

  const allMatches = matchesResult?.data || []
  const matchStats = allMatches
  const matchGoals = goalsResult?.data || []

  // Filtrera kommande matcher: vi visar kommande matcher (kickoff >= nu),
  // plus matchen/matcherna som spelas just nu eller startade senast (tills nästa match börjar).
  // Vi döljer dock matcher där ett resultat redan har rapporterats in (dvs där final_home_score och final_away_score inte är null).
  const matchesWithoutResult = allMatches.filter(
    m => m.final_home_score === null || m.final_away_score === null
  )

  const nowStr = new Date().toISOString()
  const firstUpcomingIdx = matchesWithoutResult.findIndex(m => m.kickoff_time >= nowStr)
  
  let selectedMatches: any[] = []
  
  if (firstUpcomingIdx === -1) {
    if (matchesWithoutResult.length > 0) {
      const lastKickoff = matchesWithoutResult[matchesWithoutResult.length - 1].kickoff_time
      selectedMatches = matchesWithoutResult.filter(m => m.kickoff_time === lastKickoff)
    }
  } else {
    const pastMatches = matchesWithoutResult.slice(0, firstUpcomingIdx)
    if (pastMatches.length > 0) {
      const mostRecentPastKickoff = pastMatches[pastMatches.length - 1].kickoff_time
      const mostRecentPastMatches = pastMatches.filter(m => m.kickoff_time === mostRecentPastKickoff)
      selectedMatches = [...mostRecentPastMatches, ...matchesWithoutResult.slice(firstUpcomingIdx)]
    } else {
      selectedMatches = matchesWithoutResult.slice(firstUpcomingIdx)
    }
  }

  const upcomingMatches = selectedMatches.slice(0, 8)

  const totalRedCards = matchStats.reduce((acc: number, m: any) => acc + (m.red_cards || 0), 0)
  const totalOwnGoals = matchStats.reduce((acc: number, m: any) => acc + (m.own_goals || 0), 0)

  // Räkna ut Skytteligan (Topp 3 målskyttar, exkludera självmål)
  const scorersMap: Record<string, { player_name: string; team_name: string; goals: number }> = {}
  for (const g of matchGoals) {
    if (g.is_own_goal) continue
    const key = `${g.player_name}_${g.team_name}`
    if (!scorersMap[key]) {
      scorersMap[key] = { player_name: g.player_name, team_name: g.team_name, goals: 0 }
    }
    scorersMap[key].goals++
  }

  const topScorers = Object.values(scorersMap)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 3)

  // Räkna ut målbästa länderna (Topp 3 länder som gjort flest mål)
  const teamGoalsMap: Record<string, number> = {}
  for (const m of matchStats) {
    if (m.status === 'finished') {
      if (m.final_home_score !== null && m.final_home_score !== undefined) {
        teamGoalsMap[m.home_team] = (teamGoalsMap[m.home_team] || 0) + m.final_home_score
      }
      if (m.final_away_score !== null && m.final_away_score !== undefined) {
        teamGoalsMap[m.away_team] = (teamGoalsMap[m.away_team] || 0) + m.final_away_score
      }
    }
  }

  const topTeams = Object.entries(teamGoalsMap)
    .filter(([_, goals]) => goals > 0)
    .map(([team_name, goals]) => ({ team_name, goals }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 3)

  const now = new Date()
  const filteredDeadlines = (deadlines || []).filter(d => {
    const deadlineDate = new Date(d.deadline_at)
    // Dölj efter 2 dagar (172800000 millisekunder) från att deadline har passerats
    return deadlineDate.getTime() - now.getTime() > -172800000
  })

  if (!group || !members) {
    return <div className="p-8 text-center text-red-500">Kunde inte hitta gruppen.</div>
  }

  const userMember = members.find((m: any) => m.user_id === user.id)

  if (!userMember) {
    redirect('/dashboard')
  }

  const isAdmin = userMember?.role === 'admin'

  // --- Prize Pool Calculations ---
  const paidMembersCount = members.filter((m: any) => m.payment_status === 'paid').length
  const totalPrizePool = (group.entry_fee || 0) * paidMembersCount
  const prizes = {
    first: Math.floor(totalPrizePool * 0.60),
    second: Math.floor(totalPrizePool * 0.25),
    third: Math.floor(totalPrizePool * 0.10),
    reserved: Math.floor(totalPrizePool * 0.05),
  }

  // --- Consolidated Leaderboard Logic ---
  const userScores: Record<string, { display_name: string; match_points: number; knockout_points: number; bonus_points: number; total_points: number; points_matchday: number; is_paid: boolean }> = {}

  for (const m of members) {
    const p = m.profiles as any
    userScores[m.user_id] = {
      display_name: p?.display_name || p?.email || 'Okänd',
      match_points: 0,
      knockout_points: 0,
      bonus_points: 0,
      total_points: 0,
      points_matchday: 0,
      is_paid: m.payment_status === 'paid'
    }
  }

  // 1. Gruppera matcher efter logisk matchdag
  const matchesByDay: Record<string, typeof allMatches> = {}
  for (const m of allMatches) {
    const day = getLogicalMatchday(m.kickoff_time)
    if (!matchesByDay[day]) matchesByDay[day] = []
    matchesByDay[day].push(m)
  }

  const dayInfos = Object.entries(matchesByDay).map(([dayStr, dayMatches]) => {
    const hasLive = dayMatches.some(m => m.status === 'live')
    const hasFinished = dayMatches.some(m => m.status === 'finished')
    const allFinished = dayMatches.every(m => m.status === 'finished')
    const status = hasLive ? 'live' : (allFinished && hasFinished ? 'finished' : 'upcoming')
    return { dayStr, status, matches: dayMatches }
  })

  // Sortera matchdagar kronologiskt
  dayInfos.sort((a, b) => a.dayStr.localeCompare(b.dayStr))

  // Hitta fokus-matchdag (live först, annars senaste finished, annars första upcoming)
  let focusDayInfo = dayInfos.find(d => d.status === 'live')
  if (!focusDayInfo) {
    const finishedDays = dayInfos.filter(d => d.status === 'finished')
    if (finishedDays.length > 0) {
      focusDayInfo = finishedDays[finishedDays.length - 1]
    }
  }
  if (!focusDayInfo && dayInfos.length > 0) {
    focusDayInfo = dayInfos[0]
  }

  const focusMatchday = focusDayInfo?.dayStr || null
  const focusMatchdayStatus = focusDayInfo?.status || 'upcoming'

  // Kontrollera om vi ska nollställa inför nästa matchdag (reset-tillstånd)
  let isResetState = false
  let nextMatchTimeStr = ''
  
  // Använd pre-beräknade 'now'-datumet (rad 161) för att hålla renderingen ren
  const nowTimestamp = now.getTime()
  
  const futureMatches = allMatches
    .filter(m => m.status === 'upcoming' && new Date(m.kickoff_time).getTime() > nowTimestamp)
    .sort((a, b) => a.kickoff_time.localeCompare(b.kickoff_time))

  if (futureMatches.length > 0) {
    const nextMatch = futureMatches[0]
    const nextMatchDay = getLogicalMatchday(nextMatch.kickoff_time)
    
    if (nextMatchDay !== focusMatchday && focusMatchdayStatus === 'finished') {
      const timeToNextMatch = new Date(nextMatch.kickoff_time).getTime() - nowTimestamp
      if (timeToNextMatch <= 6 * 60 * 60 * 1000) {
        isResetState = true
        nextMatchTimeStr = formatInTimeZone(new Date(nextMatch.kickoff_time), TIMEZONE, 'HH:mm')
      }
    }
  }

  const focusDayLabel = focusMatchday ? formatLogicalMatchdayLabel(focusMatchday) : ''

  // 2. Beräkna poäng för fokus-matchdagen
  for (const p of matchPredictions || []) {
    if (userScores[p.user_id]) {
      userScores[p.user_id].match_points += (p.points_awarded || 0)
      if (p.points_awarded && p.match_id) {
        const match = allMatches.find(m => m.id === p.match_id)
        if (match && getLogicalMatchday(match.kickoff_time) === focusMatchday) {
          userScores[p.user_id].points_matchday += p.points_awarded
        }
      }
    }
  }

  for (const p of knockoutPredictions || []) {
    if (userScores[p.user_id]) {
      userScores[p.user_id].knockout_points += (p.points_awarded || 0)
      if (p.points_awarded && p.updated_at && getLogicalMatchday(p.updated_at) === focusMatchday) {
        userScores[p.user_id].points_matchday += p.points_awarded
      }
    }
  }

  for (const a of bonusAnswers || []) {
    if (userScores[a.user_id]) {
      userScores[a.user_id].bonus_points += (a.points_awarded || 0)
      if (a.points_awarded && a.graded_at && getLogicalMatchday(a.graded_at) === focusMatchday) {
        userScores[a.user_id].points_matchday += a.points_awarded
      }
    }
  }

  const leaderboard = Object.entries(userScores)
    .map(([user_id, data]) => ({
      user_id,
      ...data,
      total_points: data.match_points + data.knockout_points + data.bonus_points
    }))
    .sort((a, b) => b.total_points - a.total_points)

  // Rank assignment (pure calculation)
  const rankedLeaderboard = leaderboard.map((entry, i) => {
    let rank = 1
    if (i > 0) {
      const firstSamePointsIdx = leaderboard.findIndex(e => e.total_points === entry.total_points)
      rank = firstSamePointsIdx + 1
    }
    const memberObj = members.find((m: any) => m.user_id === entry.user_id)
    return { 
      ...entry, 
      rank, 
      previous_rank: memberObj?.previous_rank,
      previous_points: memberObj?.previous_points,
      points_24h: entry.points_matchday
    }
  })

  const focusMatches = allMatches.filter(m => getLogicalMatchday(m.kickoff_time) === focusMatchday)
  const focusMatchIds = focusMatches.map(m => m.id)
  const focusPredictions = (matchPredictions || [])
    .filter(p => focusMatchIds.includes(p.match_id))
    .map(p => ({
      user_id: p.user_id,
      match_id: p.match_id,
      points_awarded: p.points_awarded
    }))

  const formatMoney = (amount: number) => `${amount} ${group.currency}`

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:px-10 md:py-12 flex flex-col gap-10 md:gap-16 overflow-x-hidden">
      {/* Header */}
      <div className="order-1 flex flex-col md:flex-row md:items-end justify-between gap-8 text-center md:text-left">
        <div className="space-y-3 min-w-0">
          <Link href="/dashboard" className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition flex items-center justify-center md:justify-start gap-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Mina grupper
          </Link>
          <h1 className="text-3xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight break-words">{group.name}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-xl max-w-2xl mx-auto md:mx-0 break-words">{group.description}</p>
        </div>
        <div className="flex flex-row justify-center md:justify-end gap-2 sm:gap-3 shrink-0">
          {isAdmin && (
            <Link href={`/dashboard/groups/${groupId}/admin`} className="flex items-center gap-2 px-3 sm:px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl sm:rounded-2xl font-black hover:bg-zinc-200 dark:hover:bg-zinc-700 transition shadow-sm text-[10px] sm:text-xs">
              ⚙️ Admin
            </Link>
          )}
          <Link href={`/dashboard/groups/${groupId}/members`} className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 text-[10px] sm:text-xs">
            <Users className="w-4 h-4" />
            Medlemmar
          </Link>
        </div>
      </div>

      {/* Upcoming Matches Horizontal Scroll Widget */}
      {upcomingMatches && upcomingMatches.length > 0 && (
        <div className="order-2 space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <h2 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Kommande matcher</h2>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              {upcomingMatches.length}
            </span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none snap-x snap-mandatory">
            {upcomingMatches.map((match: any) => {
              const hasScore = match.final_home_score !== null && match.final_away_score !== null;
              const isLive = match.status === 'live';
              const isFinished = match.status === 'finished';

              return (
                <Link
                  key={match.id}
                  href={`/dashboard/groups/${groupId}/games/${match.game_id}#match-${match.id}`}
                  className="flex items-center justify-between p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 w-[280px] md:w-[300px] shrink-0 shadow-sm snap-start hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group cursor-pointer"
                >
                  {/* Teams */}
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1 pr-3">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg leading-none shrink-0" role="img" aria-label={match.home_team}>
                          {countryToFlag(match.home_team) || '🏳️'}
                        </span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                          {match.home_team}
                        </span>
                      </div>
                      {hasScore && (
                        <span className="text-xs font-black text-zinc-900 dark:text-white px-1">
                          {match.final_home_score}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg leading-none shrink-0" role="img" aria-label={match.away_team}>
                          {countryToFlag(match.away_team) || '🏳️'}
                        </span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                          {match.away_team}
                        </span>
                      </div>
                      {hasScore && (
                        <span className="text-xs font-black text-zinc-900 dark:text-white px-1">
                          {match.final_away_score}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time & Broadcaster Info */}
                  <div className="text-right flex flex-col items-end gap-1.5 shrink-0 pl-2">
                    {isLive ? (
                      <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30 animate-pulse uppercase tracking-wider flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5" /> Live
                      </span>
                    ) : isFinished ? (
                      <span className="text-[9px] font-extrabold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Slut
                      </span>
                    ) : (
                      <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 tracking-wide">
                        {formatKickoffTime(match.kickoff_time)}
                      </span>
                    )}
                    {match.broadcaster && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded text-[9px] font-extrabold tracking-tight uppercase">
                        <Tv className="w-2.5 h-2.5 opacity-70 shrink-0" />
                        <span>{match.broadcaster}</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Prize Pool Summary */}
      <section className="order-4 md:order-3 space-y-4">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-indigo-500 shrink-0" />
          <h2 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Prispott &amp; Fördelning</h2>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 rounded-3xl shadow-sm">
          <div className="grid grid-cols-2 gap-4 items-center divide-x divide-zinc-100 dark:divide-zinc-800">
            {/* Left: Total Prispott */}
            <div className="pr-4 flex flex-col justify-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Total Prispott</span>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                {formatMoney(totalPrizePool)}
              </div>
              <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 mt-1">
                Baserat på {paidMembersCount} betalande
              </span>
            </div>

            {/* Right: Prisfördelning */}
            <div className="pl-4 space-y-1.5 flex flex-col justify-center">
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center text-[8px] font-black shrink-0">1</span>
                  Guld (60%)
                </span>
                <span className="font-black text-zinc-900 dark:text-white">{formatMoney(prizes.first)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-zinc-400 text-white flex items-center justify-center text-[8px] font-black shrink-0">2</span>
                  Silver (25%)
                </span>
                <span className="font-black text-zinc-900 dark:text-white">{formatMoney(prizes.second)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[8px] font-black shrink-0">3</span>
                  Brons (10%)
                </span>
                <span className="font-black text-zinc-900 dark:text-white">{formatMoney(prizes.third)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-start px-1">
          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
            <span>🛡️</span>
            <span>{formatMoney(prizes.reserved)} (5%) reserverat för admin</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Games & Leaderboard */}
      <div className="order-3 md:order-4 grid lg:grid-cols-3 gap-10 md:gap-16">

        {/* Left Side: Active Games */}
        <div className="lg:col-span-1 space-y-8 min-w-0 order-2 lg:order-1">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Aktiva Spel</h2>
              {isAdmin && (
                <Link
                  href={`/dashboard/groups/${groupId}/games/create`}
                  className="text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-indigo-500 hover:text-white transition-all active:scale-95"
                >
                  + Lägg till spel
                </Link>
              )}
            </div>
            <div className="space-y-4">
              {/* Bonus Questions Card */}
              <Link
                href={`/dashboard/groups/${groupId}/bonus`}
                className="group block bg-gradient-to-br from-amber-500/5 to-amber-600/10 dark:from-amber-900/10 dark:to-amber-800/5 border border-amber-200 dark:border-amber-900/30 p-5 md:p-6 rounded-3xl hover:border-amber-400 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl font-black text-amber-900 dark:text-amber-400 group-hover:text-amber-600 transition-colors truncate">Bonusfrågor</h3>
                    <p className="text-[10px] font-black text-amber-600/60 dark:text-amber-500/50 mt-1 uppercase tracking-widest">Specialutmaningar</p>
                  </div>
                  <Trophy className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                </div>
              </Link>

              {games && games.length > 0 ? (
                games.map(game => (
                  <Link
                    key={game.id}
                    href={`/dashboard/groups/${groupId}/games/${game.id}`}
                    className="group block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 md:p-6 rounded-3xl hover:border-indigo-500 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg md:text-xl font-black text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">{game.name}</h3>
                        <p className="text-[10px] font-black text-zinc-400 mt-1 uppercase tracking-widest">{game.tournament_type}</p>
                      </div>
                      <Target className="w-5 h-5 text-zinc-200 group-hover:text-indigo-500 transition-colors shrink-0" />
                    </div>
                  </Link>
                ))
              ) : null}

              {(!games || games.length === 0) && (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                  <p className="text-zinc-500 font-bold text-sm italic">Fler spel kommer snart...</p>
                </div>
              )}
            </div>
          </div>

          {/* Viktiga Deadlines Widget */}
          {filteredDeadlines.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">Viktiga Deadlines</h3>
              </div>
              <div className="space-y-5">
                {filteredDeadlines.map(d => (
                  <div key={d.id} className="flex justify-between items-center gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <span className="text-base font-bold text-zinc-900 dark:text-white leading-tight truncate">{d.title}</span>
                      <DeadlineCountdown date={d.deadline_at} />
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        {new Date(d.deadline_at).toLocaleDateString('sv-SE', { 
                          day: 'numeric', 
                          month: 'short',
                          timeZone: 'Europe/Stockholm'
                        })}
                      </div>
                      <div className="text-[10px] font-bold text-zinc-400/60 uppercase tracking-widest">
                        kl {new Date(d.deadline_at).toLocaleTimeString('sv-SE', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          timeZone: 'Europe/Stockholm'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Consolidated Leaderboard */}
        <div className="lg:col-span-2 space-y-6 min-w-0 order-1 lg:order-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-indigo-500 shrink-0" />
              <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Leaderboard</h2>
            </div>
            {!group.hide_24h_points && focusMatchday && (
              <span className="text-[10px] sm:text-xs font-bold text-zinc-400 dark:text-zinc-500 pb-1">
                {isResetState ? (
                  <span className="flex items-center gap-1">
                    ⏱️ Återställd inför nästa omgång {nextMatchTimeStr && `(avspark kl ${nextMatchTimeStr})`}
                  </span>
                ) : (
                  <span>
                    Poängökning visas för: <span className="text-indigo-600 dark:text-indigo-400 capitalize">{focusDayLabel}</span>
                  </span>
                )}
              </span>
            )}
          </div>

          <LeaderboardClient
            rankedLeaderboard={rankedLeaderboard}
            currentUserId={user.id}
            focusMatches={focusMatches}
            predictions={focusPredictions}
            hide24hPoints={!!group.hide_24h_points}
            isResetState={isResetState}
            focusDayLabel={focusDayLabel}
          />

          {/* Turneringsstatistik & Skytteliga */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Turneringsstatistik
                </span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm select-none">🟥</span>
                  <span className="text-sm font-black text-red-600 dark:text-red-400">{totalRedCards}</span>
                  <span className="text-[9px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Röda kort</span>
                </div>
                <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex items-center gap-1.5">
                  <span className="text-sm select-none">⚽</span>
                  <span className="text-sm font-black text-zinc-800 dark:text-zinc-200">{totalOwnGoals}</span>
                  <span className="text-[9px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Självmål</span>
                </div>
              </div>
            </div>

            {/* Skytteliga (Topp 3) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs select-none">🏆</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Skytteliga (Topp 3)
                </span>
              </div>
              {topScorers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {topScorers.map((scorer: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/60 transition hover:border-indigo-500 dark:hover:border-indigo-500/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg leading-none shrink-0" role="img" aria-label={scorer.team_name}>
                          {countryToFlag(scorer.team_name) || '🏳️'}
                        </span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate" title={scorer.player_name}>
                          {scorer.player_name}
                        </span>
                      </div>
                      <span className="text-xs font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full shrink-0">
                        {scorer.goals} mål
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500 italic">Inga mål registrerade ännu.</div>
              )}
            </div>

            {/* Målrikaste länder (Topp 3) */}
            <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xs select-none">🌍</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Målrikaste länder (Topp 3)
                </span>
              </div>
              {topTeams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {topTeams.map((team: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/60 transition hover:border-indigo-500 dark:hover:border-indigo-500/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg leading-none shrink-0" role="img" aria-label={team.team_name}>
                          {countryToFlag(team.team_name) || '🏳️'}
                        </span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate" title={team.team_name}>
                          {team.team_name}
                        </span>
                      </div>
                      <span className="text-xs font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full shrink-0">
                        {team.goals} mål
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500 italic">Inga mål registrerade ännu.</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Group Info Widget (always at the very bottom) */}
      {!group.hide_group_info && (
        <section 
          style={{ order: 99 }}
          className="bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-500/20 p-6 md:p-10 rounded-[32px] md:rounded-[40px] space-y-8 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Users className="w-24 h-24 text-indigo-500" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight text-indigo-900 dark:text-indigo-100 relative z-10">Gruppinfo</h3>
          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-center pb-4 border-b border-indigo-200/50 dark:border-indigo-800/50 gap-4">
              <span className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest shrink-0">Insats</span>
              <span className="text-lg md:text-xl font-black text-indigo-900 dark:text-white truncate">{group.entry_fee} {group.currency}</span>
            </div>
            {group.payment_info && (
              <div className="flex justify-between items-center pb-4 border-b border-indigo-200/50 dark:border-indigo-800/50 gap-4">
                <span className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest shrink-0">Swish till</span>
                <span className="text-lg md:text-xl font-black text-indigo-900 dark:text-white truncate">{group.payment_info}</span>
              </div>
            )}
            <div className="flex justify-between items-center pb-4 border-b border-indigo-200/50 dark:border-indigo-800/50 gap-4">
              <span className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest shrink-0">Deltagare</span>
              <span className="text-lg md:text-xl font-black text-indigo-900 dark:text-white">{members.length}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest shrink-0">Din Roll</span>
              <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full uppercase tracking-widest truncate">{userMember?.role}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function ArrowLeft(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}
