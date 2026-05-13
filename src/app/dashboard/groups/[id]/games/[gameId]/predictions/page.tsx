import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'
import { saveAllPredictions } from './actions'
import { ArrowLeft, Lock, Unlock, CheckCircle2, Save } from 'lucide-react'
import { PredictionsForm } from './PredictionsForm'
import { countryToFlag } from '@/lib/utils/flags'
import { TabBar } from '@/components/TabBar'
import { SubmitButton } from '@/components/ui/SubmitButton'

const TIMEZONE = 'Europe/Stockholm'

export default async function PredictionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; gameId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const { id: groupId, gameId } = resolvedParams;
  const activeTab = (resolvedSearch.tab === 'played' ? 'played' : 'upcoming') as 'upcoming' | 'played'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: allMatches } = await supabase
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

  const { data: game } = await supabase
    .from('games')
    .select('locked_stages')
    .eq('id', gameId)
    .single()

  const lockedStages = game?.locked_stages || []

  const isUpcoming = (match: any) =>
    match.status === 'upcoming' && new Date(match.kickoff_time) >= new Date()

  const upcomingMatches = (allMatches || []).filter(isUpcoming)
  const playedMatches = (allMatches || []).filter(m => !isUpcoming(m))
  const matches = activeTab === 'upcoming' ? upcomingMatches : playedMatches

  // Group active tab's matches
  const matchesByGroup = matches.reduce((acc: any, match: any) => {
    const key = match.group_name || match.stage || 'Övrigt'
    if (!acc[key]) acc[key] = []
    acc[key].push(match)
    return acc
  }, {})

  const bindedSaveAll = saveAllPredictions.bind(null, groupId, gameId)

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 pb-32">
      <Link href={`/dashboard/groups/${groupId}/games/${gameId}`} className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition flex items-center gap-2 mb-8">
        <ArrowLeft className="w-3.5 h-3.5" /> Tillbaka till Spelet
      </Link>

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-1">Dina Tips</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-base">Tippa resultatet innan matchstart. Efter avspark låses tipset.</p>
        </div>
      </div>

      <PredictionsForm action={bindedSaveAll}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <TabBar
            activeTab={activeTab}
            upcomingCount={upcomingMatches.length}
            playedCount={playedMatches.length}
          />
          <SubmitButton 
            type="submit" 
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 text-[10px] sm:text-xs uppercase tracking-widest"
          >
            <div className="flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              Spara Tips
            </div>
          </SubmitButton>
        </div>

        {matches.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center text-zinc-400 font-bold italic">
            {activeTab === 'upcoming' ? 'Inga kommande matcher att tippa.' : 'Inga spelade matcher ännu.'}
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(matchesByGroup).map(([groupName, groupMatches]: [string, any]) => (
              <section key={groupName} className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <h2 className="font-black text-xl text-zinc-900 dark:text-white uppercase tracking-tight">{groupName}</h2>
                  <div className="h-px bg-zinc-200 dark:border-zinc-800 flex-1"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupMatches.map((match: any) => {
                    const prediction = predictionMap.get(match.id)
                    const isManuallyLocked = lockedStages.includes(match.stage) || lockedStages.includes(match.group_name)
                    const isTimeLocked = new Date(match.kickoff_time) < new Date() || match.status !== 'upcoming'
                    const isLocked = isManuallyLocked || isTimeLocked

                    return (
                      <div key={match.id} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 transition-all shadow-sm flex flex-col justify-between ${isLocked ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : 'hover:border-indigo-500'}`}>

                        <div className="flex justify-between items-start mb-6">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                              {formatInTimeZone(new Date(match.kickoff_time), TIMEZONE, 'd MMM HH:mm')}
                            </p>
                            <p className="text-[10px] font-bold text-zinc-400 truncate max-w-[120px]">
                              {match.venue || ''}
                            </p>
                          </div>

                          {isLocked ? (
                            <div className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                              <Lock className="w-3 h-3" />
                              Låst
                            </div>
                          ) : (
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                              <Unlock className="w-3 h-3" />
                              Öppet
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-4 mb-6">
                          {/* Home Team */}
                          <div className="flex flex-col items-center flex-1 min-w-0">
                            <div className="flex flex-col items-center mb-3">
                              <span className="text-2xl mb-1">{countryToFlag(match.home_team)}</span>
                              <span className="text-xs font-black text-zinc-900 dark:text-white truncate text-center w-full uppercase tracking-tight">
                                {match.home_team}
                              </span>
                            </div>
                            <input
                              type="number"
                              name={`homeScore_${match.id}`}
                              min="0"
                              disabled={isLocked}
                              defaultValue={prediction?.predicted_home_score ?? ''}
                              placeholder="-"
                              className="w-14 h-14 md:w-16 md:h-16 text-center text-xl md:text-2xl font-black rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shadow-inner text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-40 transition-all outline-none"
                            />
                          </div>

                          <div className="text-zinc-200 dark:text-zinc-800 font-black text-lg self-center mt-8">:</div>

                          {/* Away Team */}
                          <div className="flex flex-col items-center flex-1 min-w-0">
                            <div className="flex flex-col items-center mb-3">
                              <span className="text-2xl mb-1">{countryToFlag(match.away_team)}</span>
                              <span className="text-xs font-black text-zinc-900 dark:text-white truncate text-center w-full uppercase tracking-tight">
                                {match.away_team}
                              </span>
                            </div>
                            <input
                              type="number"
                              name={`awayScore_${match.id}`}
                              min="0"
                              disabled={isLocked}
                              defaultValue={prediction?.predicted_away_score ?? ''}
                              placeholder="-"
                              className="w-14 h-14 md:w-16 md:h-16 text-center text-xl md:text-2xl font-black rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shadow-inner text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-40 transition-all outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-center">
                          {prediction && isLocked && prediction.points_awarded !== null ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                              <TrophyIcon className="w-3 h-3" />
                              {prediction.points_awarded} poäng
                            </div>
                          ) : prediction ? (
                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Sparat
                            </div>
                          ) : (
                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 dark:text-zinc-600">Ej tippad</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </PredictionsForm>
    </div>
  )
}

function TrophyIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}
