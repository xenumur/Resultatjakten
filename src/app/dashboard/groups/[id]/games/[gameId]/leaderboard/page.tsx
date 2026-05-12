import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Medal } from 'lucide-react'

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const resolvedParams = await params;
  const { id: groupId, gameId } = resolvedParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: members } = await supabase
    .from('group_members')
    .select(`
      user_id,
      profiles:user_id(display_name)
    `)
    .eq('group_id', groupId)

  const [
    { data: predictions },
    { data: knockoutPredictions },
    { data: bonusAnswers }
  ] = await Promise.all([
    supabase.from('predictions').select('user_id, points_awarded').eq('game_id', gameId).not('points_awarded', 'is', null),
    supabase.from('knockout_predictions').select('user_id, points_awarded').eq('game_id', gameId).not('points_awarded', 'is', null),
    supabase.from('bonus_answers').select('user_id, points_awarded').match({ 'bonus_questions.game_id': gameId }).select('user_id, points_awarded, bonus_questions!inner(game_id)')
  ])

  const matchLeaderboard = (members || []).map(member => {
    const userMatchPoints = (predictions || [])
      .filter(p => p.user_id === member.user_id)
      .reduce((sum, p) => sum + (p.points_awarded || 0), 0)
    
    const userBonusPoints = (bonusAnswers || [])
      .filter(a => a.user_id === member.user_id)
      .reduce((sum, a) => sum + (a.points_awarded || 0), 0)

    const totalMatchPoints = userMatchPoints + userBonusPoints
    
    const exactMatches = (predictions || [])
      .filter(p => p.user_id === member.user_id && p.points_awarded === 7).length
    
    return {
      userId: member.user_id,
      name: (member.profiles as any)?.display_name || 'Okänd',
      points: totalMatchPoints,
      exactMatches,
      matchesPlayed: (predictions || []).filter(p => p.user_id === member.user_id).length
    }
  }).sort((a, b) => b.points - a.points || b.exactMatches - a.exactMatches)

  const knockoutLeaderboard = (members || []).map(member => {
    const userKnockoutPoints = (knockoutPredictions || [])
      .filter(p => p.user_id === member.user_id)
      .reduce((sum, p) => sum + (p.points_awarded || 0), 0)

    return {
      userId: member.user_id,
      name: (member.profiles as any)?.display_name || 'Okänd',
      points: userKnockoutPoints,
    }
  }).filter(entry => entry.points > 0).sort((a, b) => b.points - a.points)

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
      <Link href={`/dashboard/groups/${groupId}/games/${gameId}`} className="inline-flex items-center text-sm font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors active:scale-95">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Tillbaka till Spelet
      </Link>

      {/* MATCH LEADERBOARD */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Matchtips</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Poäng från matchresultat och bonusfrågor</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="p-5 font-bold text-xs uppercase tracking-wider text-zinc-400">Pos</th>
                  <th className="p-5 font-bold text-xs uppercase tracking-wider text-zinc-400">Spelare</th>
                  <th className="p-5 font-bold text-xs uppercase tracking-wider text-zinc-400 hidden sm:table-cell text-center">Exakta</th>
                  <th className="p-5 font-bold text-xs uppercase tracking-wider text-zinc-400 hidden md:table-cell text-center">Spelade</th>
                  <th className="p-5 font-bold text-xs uppercase tracking-wider text-indigo-500 text-right">Poäng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {matchLeaderboard.map((entry, index) => {
                  const isTop3 = index < 3;
                  const isMe = entry.userId === user.id;
                  return (
                  <tr key={entry.userId} className={`group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${isMe ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}>
                    <td className="p-5 w-16">
                      {index === 0 ? <Medal className="w-7 h-7 text-amber-400" /> : 
                       index === 1 ? <Medal className="w-7 h-7 text-zinc-300" /> : 
                       index === 2 ? <Medal className="w-7 h-7 text-amber-700" /> : 
                       <span className="text-lg font-bold text-zinc-400 pl-2">{index + 1}</span>}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${isTop3 ? 'bg-indigo-600 text-white shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
                          {entry.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-bold ${isTop3 ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-200'}`}>
                            {entry.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 hidden sm:table-cell text-center font-medium text-zinc-500">{entry.exactMatches}</td>
                    <td className="p-5 hidden md:table-cell text-center font-medium text-zinc-500">{entry.matchesPlayed}</td>
                    <td className="p-5 text-right">
                      <span className={`font-black ${isTop3 ? 'text-2xl text-indigo-600 dark:text-indigo-400' : 'text-xl text-zinc-700 dark:text-zinc-300'}`}>
                        {entry.points}
                      </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* KNOCKOUT LEADERBOARD */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Medal className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Slutspelstips</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Poäng från gissade lag i slutspelsrundorna</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-zinc-400">Pos</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-zinc-400">Spelare</th>
                <th className="p-5 font-bold text-xs uppercase tracking-wider text-amber-500 text-right">Poäng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {knockoutLeaderboard.map((entry, index) => (
                <tr key={entry.userId} className={`group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${entry.userId === user.id ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}>
                  <td className="p-5 w-16">
                    <span className="text-lg font-bold text-zinc-400 pl-2">{index + 1}</span>
                  </td>
                  <td className="p-5">
                    <span className="font-bold text-zinc-900 dark:text-white">{entry.name}</span>
                  </td>
                  <td className="p-5 text-right">
                    <span className="font-black text-xl text-amber-600 dark:text-amber-400">{entry.points}</span>
                  </td>
                </tr>
              ))}
              {knockoutLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-zinc-500">Inga poäng utdelade än.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
