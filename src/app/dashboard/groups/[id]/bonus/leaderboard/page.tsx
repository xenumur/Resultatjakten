import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy, Medal } from 'lucide-react'

export default async function BonusLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const groupId = resolvedParams.id
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: members }, { data: answers }] = await Promise.all([
    supabase.from('group_members').select('*, profiles:user_id(display_name, email)').eq('group_id', groupId),
    supabase.from('bonus_answers').select('*, bonus_questions!inner(group_id)').eq('bonus_questions.group_id', groupId)
  ])

  if (!members) redirect(`/dashboard/groups/${groupId}`)

  // Calculate scores
  const userScores: Record<string, { display_name: string; answered: number; points: number }> = {}
  
  for (const m of members) {
    const p = m.profiles as any
    userScores[m.user_id] = {
      display_name: p?.display_name || p?.email || 'Okänd',
      answered: 0,
      points: 0
    }
  }

  for (const a of answers || []) {
    if (userScores[a.user_id]) {
      userScores[a.user_id].answered += 1
      userScores[a.user_id].points += (a.points_awarded || 0)
    }
  }

  const leaderboard = Object.entries(userScores)
    .map(([user_id, data]) => ({
      user_id,
      ...data
    }))
    .sort((a, b) => b.points - a.points || b.answered - a.answered)

  // Rank assignment
  let currentRank = 1
  const rankedLeaderboard = leaderboard.map((entry, i) => {
    if (i > 0 && (entry.points < leaderboard[i - 1].points)) {
      currentRank = i + 1
    }
    return { ...entry, rank: currentRank }
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-10 md:py-12 space-y-12">
      <Link href={`/dashboard/groups/${groupId}/bonus`} className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition flex items-center gap-2">
        <ArrowLeft className="w-3.5 h-3.5" /> Tillbaka till Bonus
      </Link>

      <div className="space-y-8">
        <div className="text-center space-y-4">
          <Trophy className="w-16 h-16 text-indigo-600 mx-auto" />
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">Bonus-ställning</h1>
          <p className="text-zinc-500 font-bold">Vem har bäst koll på bonusfrågorna?</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">#</th>
                  <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Deltagare</th>
                  <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Besvarade</th>
                  <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Poäng</th>
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
                      <td className="py-6 px-8">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                          entry.rank === 1 ? 'bg-amber-400 text-white shadow-lg' :
                          entry.rank === 2 ? 'bg-zinc-400 text-white shadow-lg' :
                          entry.rank === 3 ? 'bg-orange-500 text-white shadow-lg' :
                          'text-zinc-400'
                        }`}>
                          {entry.rank}
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shrink-0 text-sm ${
                            entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                            isMe ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                            'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                          }`}>
                            {entry.display_name[0].toUpperCase()}
                          </div>
                          <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            {entry.display_name}
                            {isMe && <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-600 text-white px-1.5 py-0.5 rounded">Du</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-center font-bold text-zinc-500">{entry.answered}</td>
                      <td className="py-6 px-8 text-right">
                        <span className={`text-2xl font-black ${isTop3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'}`}>
                          {entry.points}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
