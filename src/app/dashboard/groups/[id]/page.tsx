import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Coins, Target, Users, Medal } from 'lucide-react'

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
    { data: bonusAnswers }
  ] = await Promise.all([
    supabase.from('groups').select('*').eq('id', groupId).single(),
    supabase.from('group_members').select('*, profiles:user_id(display_name, email)').eq('group_id', groupId),
    supabase.from('predictions').select('user_id, points_awarded').eq('group_id', groupId),
    supabase.from('knockout_predictions').select('user_id, points_awarded').eq('group_id', groupId),
    supabase.from('games').select('*').eq('group_id', groupId),
    supabase.from('bonus_answers').select('user_id, points_awarded, bonus_questions!inner(group_id)').eq('bonus_questions.group_id', groupId)
  ])

  if (!group || !members) {
    return <div className="p-8 text-center text-red-500">Kunde inte hitta gruppen.</div>
  }

  const userMember = members.find((m: any) => m.user_id === user.id)
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
      currentRank = i + 1
    }
    return { ...entry, rank: currentRank }
  })

  const formatMoney = (amount: number) => `${amount} ${group.currency}`

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:px-10 md:py-12 space-y-10 md:space-y-16 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 text-center md:text-left">
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

      {/* Prize Pool Summary */}
      <section className="space-y-6">
        <div className="flex items-center justify-center md:justify-start gap-2">
          <Coins className="w-5 h-5 text-amber-500 shrink-0" />
          <h2 className="text-lg md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Prispott & Belöningar</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-xl shadow-indigo-600/20 text-white flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Prispott</span>
            <div className="mt-auto">
              <div className="text-3xl md:text-4xl font-black leading-none">{formatMoney(totalPrizePool)}</div>
              <p className="text-[9px] font-bold mt-2 opacity-60 uppercase tracking-wide">Baserat på {paidMembersCount} betalande</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border-2 border-amber-100 dark:border-amber-900/20 p-6 rounded-3xl relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <Trophy className="w-10 h-10 md:w-12 md:h-12 text-amber-500" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">1:a Pris (60%)</span>
             <div className="mt-auto">
               <div className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white leading-none">{formatMoney(prizes.first)}</div>
               <p className="text-[9px] font-bold text-zinc-400 mt-2 uppercase tracking-wide">Guldmedaljören</p>
             </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <Medal className="w-10 h-10 md:w-12 md:h-12 text-zinc-400" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">2:a Pris (25%)</span>
             <div className="mt-auto">
               <div className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white leading-none">{formatMoney(prizes.second)}</div>
               <p className="text-[9px] font-bold text-zinc-400 mt-2 uppercase tracking-wide">Silvermedaljören</p>
             </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border-2 border-orange-100 dark:border-orange-900/20 p-6 rounded-3xl relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[140px] md:min-h-[160px] bg-gradient-to-br from-white to-orange-50/20 dark:from-zinc-900 dark:to-orange-900/5">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <Medal className="w-10 h-10 md:w-12 md:h-12 text-orange-600" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-400">3:e Pris (10%)</span>
             <div className="mt-auto">
               <div className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white leading-none">{formatMoney(prizes.third)}</div>
               <p className="text-[9px] font-bold text-zinc-400 mt-2 uppercase tracking-wide">Bronsmedaljören</p>
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
      <div className="grid lg:grid-cols-3 gap-10 md:gap-16">
        
        {/* Left Side: Active Games */}
        <div className="lg:col-span-1 space-y-8 min-w-0">
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

          {/* Group Info Widget */}
          <div className="bg-zinc-950 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white space-y-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Users className="w-24 h-24" />
             </div>
             <h3 className="text-xl font-black uppercase tracking-tight relative z-10">Gruppinfo</h3>
             <div className="space-y-6 relative z-10">
               <div className="flex justify-between items-center pb-4 border-b border-white/10 gap-4">
                 <span className="text-zinc-500 font-black text-[10px] uppercase tracking-widest shrink-0">Insats</span>
                 <span className="text-lg md:text-xl font-black truncate">{group.entry_fee} {group.currency}</span>
               </div>
               <div className="flex justify-between items-center pb-4 border-b border-white/10 gap-4">
                 <span className="text-zinc-500 font-black text-[10px] uppercase tracking-widest shrink-0">Deltagare</span>
                 <span className="text-lg md:text-xl font-black">{members.length}</span>
               </div>
               <div className="flex justify-between items-center gap-4">
                 <span className="text-zinc-500 font-black text-[10px] uppercase tracking-widest shrink-0">Din Roll</span>
                 <span className="text-[10px] font-black bg-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest truncate">{userMember?.role}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Right Side: Consolidated Leaderboard */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Leaderboard</h2>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[450px] md:min-w-[500px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-5 px-4 md:px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">#</th>
                    <th className="py-5 px-4 md:px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Deltagare</th>
                    <th className="py-5 px-4 md:px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">M</th>
                    <th className="py-5 px-4 md:px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">S</th>
                    <th className="py-5 px-4 md:px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center text-amber-500">B</th>
                    <th className="py-5 px-4 md:px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Totalt</th>
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
                        <td className="py-5 px-4 md:px-6">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] ${
                            entry.rank === 1 ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/20' :
                            entry.rank === 2 ? 'bg-zinc-400 text-white shadow-lg shadow-zinc-400/20' :
                            entry.rank === 3 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' :
                            'text-zinc-400 border border-zinc-100 dark:border-zinc-800'
                          }`}>
                            {entry.rank}
                          </div>
                        </td>
                        <td className="py-5 px-4 md:px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shrink-0 text-sm ${
                              entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                              isMe ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                              'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                            }`}>
                              {entry.display_name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-sm">
                                <span className="truncate max-w-[100px] sm:max-w-none">{entry.display_name}</span>
                                {isMe && <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-600 text-white px-1.5 py-0.5 rounded shrink-0">Du</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1 h-1 rounded-full shrink-0 ${entry.is_paid ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest truncate">
                                  {entry.is_paid ? 'Paid' : 'Unpaid'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-4 md:px-6 text-center font-bold text-zinc-500 text-xs">{entry.match_points}</td>
                        <td className="py-5 px-4 md:px-6 text-center font-bold text-zinc-500 text-xs">{entry.knockout_points}</td>
                        <td className="py-5 px-4 md:px-6 text-center font-bold text-amber-600 dark:text-amber-400 text-xs">{entry.bonus_points}</td>
                        <td className="py-5 px-4 md:px-6 text-right">
                          <span className={`text-xl font-black ${isTop3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'}`}>
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
