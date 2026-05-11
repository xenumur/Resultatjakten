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

  const [{ data: group }, { data: members }, { data: matchPredictions }, { data: knockoutPredictions }, { data: games }] = await Promise.all([
    supabase.from('groups').select('*').eq('id', groupId).single(),
    supabase.from('group_members').select('*, profiles:user_id(display_name, email)').eq('group_id', groupId),
    supabase.from('predictions').select('user_id, points_awarded').eq('group_id', groupId),
    supabase.from('knockout_predictions').select('user_id, points_awarded').eq('group_id', groupId),
    supabase.from('games').select('*').eq('group_id', groupId)
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
  const userScores: Record<string, { display_name: string; match_points: number; knockout_points: number; total_points: number; is_paid: boolean }> = {}
  
  for (const m of members) {
    const p = m.profiles as any
    userScores[m.user_id] = {
      display_name: p?.display_name || p?.email || 'Okänd',
      match_points: 0,
      knockout_points: 0,
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

  const leaderboard = Object.entries(userScores)
    .map(([user_id, data]) => ({
      user_id,
      ...data,
      total_points: data.match_points + data.knockout_points
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
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Link href="/dashboard" className="text-sm font-bold text-zinc-500 hover:text-indigo-600 transition flex items-center gap-1">
            &larr; Mina grupper
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">{group.name}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-2xl">{group.description}</p>
        </div>
        <div className="flex gap-3">
           {isAdmin && (
            <Link href={`/dashboard/groups/${groupId}/admin`} className="flex items-center gap-2 px-5 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-black hover:bg-zinc-200 dark:hover:bg-zinc-700 transition shadow-sm">
              ⚙️ Admin
            </Link>
          )}
          <Link href={`/dashboard/groups/${groupId}/members`} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20">
            <Users className="w-5 h-5" />
            Medlemmar
          </Link>
        </div>
      </div>

      {/* Prize Pool Summary */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Prispott & Belöningar</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-xl shadow-indigo-600/20 text-white flex flex-col justify-between">
            <span className="text-sm font-bold uppercase tracking-widest opacity-80">Total Prispott</span>
            <div className="mt-4">
              <div className="text-4xl font-black">{formatMoney(totalPrizePool)}</div>
              <p className="text-xs font-bold mt-1 opacity-70">Baserat på {paidMembersCount} betalande</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border-2 border-amber-200 dark:border-amber-900/30 p-6 rounded-3xl relative overflow-hidden shadow-sm">
             <div className="absolute top-0 right-0 p-3 opacity-10">
               <Trophy className="w-16 h-16 text-amber-500" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">1:a Pris (60%)</span>
             <div className="text-3xl font-black text-zinc-900 dark:text-white mt-3">{formatMoney(prizes.first)}</div>
             <p className="text-xs text-zinc-500 mt-1">Guldmedaljören</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 p-6 rounded-3xl relative overflow-hidden shadow-sm">
             <div className="absolute top-0 right-0 p-3 opacity-5">
               <Medal className="w-16 h-16 text-zinc-400" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">2:a Pris (25%)</span>
             <div className="text-2xl font-black text-zinc-900 dark:text-white mt-3">{formatMoney(prizes.second)}</div>
             <p className="text-xs text-zinc-500 mt-1">Silvermedaljören</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border-2 border-orange-200 dark:border-orange-900/30 p-6 rounded-3xl relative overflow-hidden shadow-sm bg-gradient-to-br from-white to-orange-50/30 dark:from-zinc-900 dark:to-orange-900/5">
             <div className="absolute top-0 right-0 p-3 opacity-10">
               <Medal className="w-16 h-16 text-orange-600" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-400">3:e Pris (10%)</span>
             <div className="text-2xl font-black text-zinc-900 dark:text-white mt-3">{formatMoney(prizes.third)}</div>
             <p className="text-xs text-zinc-500 mt-1">Bronsmedaljören</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900/50 w-fit px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800">
           🛡️ {formatMoney(prizes.reserved)} (5%) reserverat för admin/plattformskostnader
        </div>
      </section>

      {/* Main Grid: Games & Leaderboard */}
      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* Left Side: Active Games */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Aktiva Spel</h2>
          </div>
          
          <div className="space-y-4">
            {games && games.length > 0 ? (
              games.map(game => (
                <Link 
                  key={game.id} 
                  href={`/dashboard/groups/${groupId}/games/${game.id}`} 
                  className="group block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl hover:border-indigo-500 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">{game.name}</h3>
                      <p className="text-sm font-bold text-zinc-400 mt-1 uppercase tracking-wider">{game.tournament_type}</p>
                    </div>
                    <Target className="w-6 h-6 text-zinc-200 group-hover:text-indigo-200 transition-colors" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-10 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-500 font-bold">Inga spel än.</p>
              </div>
            )}
          </div>

          {/* Group Info Widget */}
          <div className="bg-zinc-900 dark:bg-zinc-950 p-8 rounded-[40px] text-white space-y-6 shadow-2xl">
             <h3 className="text-xl font-black">Gruppinfo</h3>
             <div className="space-y-4">
               <div className="flex justify-between items-center pb-4 border-b border-white/10">
                 <span className="text-zinc-400 font-bold text-sm uppercase tracking-widest">Insats</span>
                 <span className="text-xl font-black">{group.entry_fee} {group.currency}</span>
               </div>
               <div className="flex justify-between items-center pb-4 border-b border-white/10">
                 <span className="text-zinc-400 font-bold text-sm uppercase tracking-widest">Deltagare</span>
                 <span className="text-xl font-black">{members.length}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-zinc-400 font-bold text-sm uppercase tracking-widest">Din Roll</span>
                 <span className="text-sm font-black bg-indigo-500 px-3 py-1 rounded-full">{userMember?.role?.toUpperCase()}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Right Side: Consolidated Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <Medal className="w-6 h-6 text-indigo-500" />
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Gruppens Leaderboard</h2>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Plac</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">Deltagare</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Matcher</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Slutspel</th>
                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Totalt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {rankedLeaderboard.map((entry) => {
                    const isTop3 = entry.rank <= 3
                    const isMe = entry.user_id === user.id
                    
                    return (
                      <tr 
                        key={entry.user_id} 
                        className={`transition-colors ${isMe ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}
                      >
                        <td className="py-5 px-6">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                            entry.rank === 1 ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/20' :
                            entry.rank === 2 ? 'bg-zinc-400 text-white shadow-lg shadow-zinc-400/20' :
                            entry.rank === 3 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' :
                            'text-zinc-400'
                          }`}>
                            {entry.rank}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 ${
                              entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                              isMe ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                              'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                            }`}>
                              {entry.display_name[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                {entry.display_name}
                                {isMe && <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-600 text-white px-1.5 py-0.5 rounded">Du</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${entry.is_paid ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                  {entry.is_paid ? 'Betalat' : 'Ej betalat'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center font-bold text-zinc-600 dark:text-zinc-400">{entry.match_points}</td>
                        <td className="py-5 px-6 text-center font-bold text-zinc-600 dark:text-zinc-400">{entry.knockout_points}</td>
                        <td className="py-5 px-6 text-right">
                          <span className={`text-2xl font-black ${isTop3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'}`}>
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
              <div className="p-12 text-center text-zinc-400 font-bold italic">
                Ingen data att visa ännu.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
