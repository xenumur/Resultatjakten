import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Coins, Target, Users, Medal, ArrowUp, ArrowDown, Calendar, Clock, Tv } from 'lucide-react'
import { DeadlineCountdown } from '@/components/DeadlineCountdown'
import { countryToFlag } from '@/lib/utils/flags'
import { formatInTimeZone } from 'date-fns-tz'
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
    supabase.from('predictions').select('user_id, points_awarded').eq('group_id', groupId),
    supabase.from('knockout_predictions').select('user_id, points_awarded').eq('group_id', groupId),
    supabase.from('games').select('*').eq('group_id', groupId),
    supabase.from('bonus_answers').select('user_id, points_awarded, bonus_questions!inner(group_id)').eq('bonus_questions.group_id', groupId),
    supabase.from('group_deadlines').select('*').eq('group_id', groupId).order('deadline_at', { ascending: true })
  ])

  // Hämta de 4 närmaste kommande matcherna för gruppens spel
  const gameIds = (games || []).map(g => g.id)
  const { data: upcomingMatches } = gameIds.length > 0
    ? await supabase
        .from('matches')
        .select('*')
        .in('game_id', gameIds)
        .eq('status', 'upcoming')
        .gte('kickoff_time', new Date().toISOString())
        .order('kickoff_time', { ascending: true })
        .limit(4)
    : { data: [] }

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
  const userScores: Record<string, { display_name: string; match_points: number; knockout_points: number; bonus_points: number; total_points: number; is_paid: boolean }> = {}

  for (const m of members) {
    const p = m.profiles as any
    userScores[m.user_id] = {
      display_name: p?.display_name || p?.email || 'Okänd',
      match_points: 0,
      knockout_points: 0,
      bonus_points: 0,
      total_points: 0,
      is_paid: m.payment_status === 'paid'
    }
  }

  for (const p of matchPredictions || []) {
    if (userScores[p.user_id]) {
      userScores[p.user_id].match_points += (p.points_awarded || 0)
    }
  }

  for (const p of knockoutPredictions || []) {
    if (userScores[p.user_id]) {
      userScores[p.user_id].knockout_points += (p.points_awarded || 0)
    }
  }

  for (const a of bonusAnswers || []) {
    if (userScores[a.user_id]) {
      userScores[a.user_id].bonus_points += (a.points_awarded || 0)
    }
  }

  const leaderboard = Object.entries(userScores)
    .map(([user_id, data]) => ({
      user_id,
      ...data,
      total_points: data.match_points + data.knockout_points + data.bonus_points
    }))
    .sort((a, b) => b.total_points - a.total_points)

  // Rank assignment
  let currentRank = 1
  const rankedLeaderboard = leaderboard.map((entry, i) => {
    if (i > 0 && entry.total_points < leaderboard[i - 1].total_points) {
      currentRank++
    }
    const memberObj = members.find((m: any) => m.user_id === entry.user_id)
    return { ...entry, rank: currentRank, previous_rank: memberObj?.previous_rank }
  })

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
            {upcomingMatches.map((match: any) => (
              <Link
                key={match.id}
                href={`/dashboard/groups/${groupId}/games/${match.game_id}#match-${match.id}`}
                className="flex items-center justify-between p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 min-w-[280px] max-w-[320px] flex-1 shadow-sm snap-start hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors shrink-0 group cursor-pointer"
              >
                {/* Teams */}
                <div className="flex flex-col gap-1.5 min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg leading-none shrink-0" role="img" aria-label={match.home_team}>
                      {countryToFlag(match.home_team) || '🏳️'}
                    </span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                      {match.home_team}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg leading-none shrink-0" role="img" aria-label={match.away_team}>
                      {countryToFlag(match.away_team) || '🏳️'}
                    </span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                      {match.away_team}
                    </span>
                  </div>
                </div>

                {/* Time & Broadcaster Info */}
                <div className="text-right flex flex-col items-end gap-1.5 shrink-0 pl-2">
                  <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 tracking-wide">
                    {formatKickoffTime(match.kickoff_time)}
                  </span>
                  {match.broadcaster && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded text-[9px] font-extrabold tracking-tight uppercase">
                      <Tv className="w-2.5 h-2.5 opacity-70 shrink-0" />
                      <span>{match.broadcaster}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Prize Pool Summary */}
      <section className="order-4 md:order-3 space-y-6">
        <div className="flex items-center justify-center md:justify-start gap-2">
          <Coins className="w-5 h-5 text-amber-500 shrink-0" />
          <h2 className="text-lg md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Prispott & Belöningar</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-xl shadow-indigo-600/20 text-white flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Prispott</span>
            <div className="mt-auto">
              <div className="text-3xl md:text-4xl font-black leading-none">{formatMoney(totalPrizePool)}</div>
              <p className="text-[9px] font-bold mt-2 opacity-60 uppercase tracking-wide">Baserat på {paidMembersCount} betalande</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Prisfördelning</span>
            <div className="space-y-3 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-[10px] font-black shadow-sm shadow-amber-400/20">1</div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Guld (60%)</span>
                </div>
                <span className="font-black text-amber-600 dark:text-amber-400 text-base">{formatMoney(prizes.first)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-400 text-white flex items-center justify-center text-[10px] font-black shadow-sm shadow-zinc-400/20">2</div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Silver (25%)</span>
                </div>
                <span className="font-black text-zinc-600 dark:text-zinc-400 text-base">{formatMoney(prizes.second)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black shadow-sm shadow-orange-500/20">3</div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Brons (10%)</span>
                </div>
                <span className="font-black text-orange-600 dark:text-orange-400 text-base">{formatMoney(prizes.third)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center md:justify-start">
          <div className="text-center md:text-left flex items-center gap-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-100 dark:border-zinc-800 max-w-full overflow-hidden">
            <span className="shrink-0">🛡️</span> <span className="truncate">{formatMoney(prizes.reserved)} (5%) reserverat för admin</span>
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
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Leaderboard</h2>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-3 pl-4 pr-2 md:py-5 md:px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">#</th>
                    <th className="py-3 px-2 md:py-5 md:px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Deltagare</th>
                    <th className="py-3 px-1.5 md:py-5 md:px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">M</th>
                    <th className="py-3 px-1.5 md:py-5 md:px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">S</th>
                    <th className="py-3 px-1.5 md:py-5 md:px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center text-amber-500">B</th>
                    <th className="py-3 pl-2 pr-4 md:py-5 md:px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Totalt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {rankedLeaderboard.map((entry) => {
                    const isTop3 = entry.rank <= 3
                    const isMe = entry.user_id === user.id

                    return (
                      <tr
                        key={entry.user_id}
                        className={`transition-colors ${isMe ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}
                      >
                        <td className="py-3 pl-4 pr-2 md:py-5 md:px-6">
                          <div className={`mx-auto w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-black text-[10px] ${entry.rank === 1 ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/20' :
                              entry.rank === 2 ? 'bg-zinc-400 text-white shadow-lg shadow-zinc-400/20' :
                                entry.rank === 3 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' :
                                  'text-zinc-400 border border-zinc-100 dark:border-zinc-800'
                            }`}>
                            {entry.rank}
                          </div>
                        </td>
                        <td className="py-3 px-2 md:py-5 md:px-6">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center font-black text-white shrink-0 text-sm ${entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                                isMe ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                                  'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                              }`}>
                              {entry.display_name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 md:gap-2 text-sm">
                                <span className="truncate max-w-[80px] xs:max-w-[100px] sm:max-w-none">{entry.display_name}</span>
                                {entry.previous_rank && entry.rank < entry.previous_rank && (
                                  <div className="flex items-center gap-0.5 text-emerald-500 font-black text-[10px] bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                                    <ArrowUp className="w-2.5 h-2.5 shrink-0" />
                                    <span>{entry.previous_rank - entry.rank}</span>
                                  </div>
                                )}
                                {entry.previous_rank && entry.rank > entry.previous_rank && (
                                  <div className="flex items-center gap-0.5 text-red-500 font-black text-[10px] bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-100 dark:border-red-500/20">
                                    <ArrowDown className="w-2.5 h-2.5 shrink-0" />
                                    <span>{entry.rank - entry.previous_rank}</span>
                                  </div>
                                )}
                                {isMe && <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-600 text-white px-1.5 py-0.5 rounded shrink-0">Du</span>}
                              </div>
                              <div className="flex items-center gap-1 md:gap-1.5">
                                <span className={`w-1 h-1 rounded-full shrink-0 ${entry.is_paid ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest truncate">
                                  {entry.is_paid ? 'Paid' : 'Unpaid'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-1.5 md:py-5 md:px-6 text-center font-bold text-zinc-500 text-[11px] md:text-xs">{entry.match_points}</td>
                        <td className="py-3 px-1.5 md:py-5 md:px-6 text-center font-bold text-zinc-500 text-[11px] md:text-xs">{entry.knockout_points}</td>
                        <td className="py-3 px-1.5 md:py-5 md:px-6 text-center font-bold text-amber-600 dark:text-amber-400 text-[11px] md:text-xs">{entry.bonus_points}</td>
                        <td className="py-3 pl-2 pr-4 md:py-5 md:px-6 text-right">
                          <span className={`text-base md:text-xl font-black ${isTop3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'}`}>
                            {entry.total_points}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {leaderboard.length === 0 && (
              <div className="p-16 text-center text-zinc-400 font-black text-sm italic uppercase tracking-widest">
                Ingen data ännu.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Group Info Widget (always at the very bottom) */}
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
