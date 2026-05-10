import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { saveAllPredictions } from './actions'
import { ArrowLeft, Lock, Unlock, CheckCircle2, Save } from 'lucide-react'

export default async function PredictionsPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const resolvedParams = await params;
  const { id: groupId, gameId } = resolvedParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('game_id', gameId)
    .order('kickoff_time', { ascending: true })

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)
    .eq('game_id', gameId)

  const predictionMap = new Map(predictions?.map(p => [p.match_id, p]) || [])

  // Hämta spelet för att se om admin har låst några specifika faser manuellt
  const { data: game } = await supabase
    .from('games')
    .select('locked_stages')
    .eq('id', gameId)
    .single()
    
  const lockedStages = game?.locked_stages || []
  
  // Hämta alla unika lagnamn från turneringen för att kunna välja i slutspelet
  const allTeams = Array.from(new Set((matches || []).flatMap(m => [m.home_team, m.away_team])))
    .filter((name: string) => name && !name.includes('Winner') && !name.includes('Loser') && !name.includes('Match'))
    .sort()

  // Gruppera matcherna
  const matchesByGroup = (matches || []).reduce((acc: any, match: any) => {
    const key = match.group_name || match.stage || 'Övrigt';
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

  const bindedSaveAll = saveAllPredictions.bind(null, groupId, gameId)

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-32">
      <Link href={`/dashboard/groups/${groupId}/games/${gameId}`} className="inline-flex items-center text-sm font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors active:scale-95">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Tillbaka
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">Dina Tips</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg">Tippa resultatet innan matchstart. Efter avspark låses tipset.</p>
      </div>

      <form action={bindedSaveAll} className="space-y-12">
        {Object.entries(matchesByGroup).map(([groupName, groupMatches]: [string, any]) => (
          <div key={groupName} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 z-10">
              <h2 className="font-bold text-lg">{groupName}</h2>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {groupMatches.map((match: any) => {
                const prediction = predictionMap.get(match.id)
                const isManuallyLocked = lockedStages.includes(match.stage) || lockedStages.includes(match.group_name)
                const isTimeLocked = new Date(match.kickoff_time) < new Date() || match.status !== 'upcoming'
                const isLocked = isManuallyLocked || isTimeLocked

                return (
                  <div key={match.id} className={`p-6 transition-all ${isLocked ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                        {format(new Date(match.kickoff_time), 'd MMM HH:mm')} • {match.venue || match.stage}
                      </span>
                      {match.group_name === null && (
                        <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                          Gissa lagen + resultat
                        </span>
                      )}
                      {isLocked ? (
                        <span className="text-xs font-bold uppercase tracking-widest text-red-500 flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                          <Lock className="w-3.5 h-3.5" />
                          {isManuallyLocked ? 'Fas Låst' : 'Låst'}
                        </span>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                          <Unlock className="w-3.5 h-3.5" />
                          Öppet
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col items-center flex-1">
                          {match.group_name === null ? (
                            <select 
                              name={`homeTeam_${match.id}`}
                              disabled={isLocked}
                              defaultValue={prediction?.predicted_home_team || match.home_team}
                              className="w-full mb-3 text-sm font-bold p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Välj lag...</option>
                              {allTeams.map(team => <option key={team} value={team}>{team}</option>)}
                              {/* Lägg till nuvarande ifall det är Winner Match X */}
                              {!allTeams.includes(match.home_team) && <option value={match.home_team}>{match.home_team}</option>}
                            </select>
                          ) : (
                            <span className="font-extrabold text-xl mb-4 text-center tracking-tight text-zinc-900 dark:text-white">{match.home_team}</span>
                          )}
                          <input 
                            type="number" 
                            name={`homeScore_${match.id}`}
                            min="0"
                            disabled={isLocked}
                            defaultValue={prediction?.predicted_home_score ?? ''}
                            className="w-20 h-24 text-center text-4xl font-black rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 transition-all outline-none"
                          />
                        </div>
                        
                        <span className="text-zinc-300 dark:text-zinc-700 font-black text-2xl mt-10">-</span>
                        
                        <div className="flex flex-col items-center flex-1">
                          {match.group_name === null ? (
                            <select 
                              name={`awayTeam_${match.id}`}
                              disabled={isLocked}
                              defaultValue={prediction?.predicted_away_team || match.away_team}
                              className="w-full mb-3 text-sm font-bold p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Välj lag...</option>
                              {allTeams.map(team => <option key={team} value={team}>{team}</option>)}
                              {!allTeams.includes(match.away_team) && <option value={match.away_team}>{match.away_team}</option>}
                            </select>
                          ) : (
                            <span className="font-extrabold text-xl mb-4 text-center tracking-tight text-zinc-900 dark:text-white">{match.away_team}</span>
                          )}
                          <input 
                            type="number" 
                            name={`awayScore_${match.id}`}
                            min="0"
                            disabled={isLocked}
                            defaultValue={prediction?.predicted_away_score ?? ''}
                            className="w-20 h-24 text-center text-4xl font-black rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center">
                        {prediction && isLocked && prediction.points_awarded !== null ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-sm">
                            <TrophyIcon className="w-4 h-4" />
                            {prediction.points_awarded} poäng
                          </div>
                        ) : prediction ? (
                          <div className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Tips sparat
                          </div>
                        ) : (
                          <div className="text-sm font-semibold text-zinc-400">Inget tips lagt</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 flex justify-center">
          <button type="submit" className="w-full max-w-sm flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 hover:shadow-2xl hover:shadow-indigo-600/30">
            <Save className="w-6 h-6" />
            Spara Alla Tips
          </button>
        </div>
      </form>
    </div>
  )
}

function TrophyIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}
