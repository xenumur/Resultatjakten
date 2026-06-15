import { Fragment } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'
import { updateMatchResult, calculateScores, syncMatchesWithProvider, acceptApiResult, deleteMatch } from './actions'
import { AlertTriangle, RefreshCw, Check, ArrowLeft, Lock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { DeleteMatchButton } from './DeleteMatchButton'
import { AdminActionButton } from './AdminActionButtons'
import { BulkMatchSaveButton } from './BulkMatchSaveButton'
import { MatchResultForm } from './MatchResultForm'
import { GameNameForm } from './GameNameForm'
import { TabBar } from '@/components/TabBar'

const TIMEZONE = 'Europe/Stockholm'

export default async function GameAdminPage({
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

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return <div className="p-12 text-center text-red-500">Åtkomst nekad. Endast för administratörer.</div>
  }

  const { data: game } = await supabase
    .from('games')
    .select('name')
    .eq('id', gameId)
    .single()

  if (!game) {
    return <div className="p-12 text-center text-red-500">Kunde inte hitta spelet.</div>
  }

  const { data: allMatches } = await supabase
    .from('matches')
    .select('*, match_goals(*)')
    .eq('game_id', gameId)
    .order('kickoff_time', { ascending: true })

  const bindedCalculateScores = calculateScores.bind(null, groupId, gameId)
  const bindedSync = syncMatchesWithProvider.bind(null, groupId, gameId)

  const allTeams = Array.from(new Set(
    allMatches?.flatMap(m => [m.home_team, m.away_team, m.provider_home_team, m.provider_away_team])
      .filter(Boolean)
  )).sort() as string[]

  const upcomingMatches = (allMatches || []).filter(m => m.status === 'upcoming' || m.status === 'live')
  const playedMatches = (allMatches || []).filter(m => m.status !== 'upcoming' && m.status !== 'live')
  const matches = activeTab === 'upcoming' ? upcomingMatches : playedMatches

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12">
      <Link 
        href={`/dashboard/groups/${groupId}/games/${gameId}`} 
        className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition flex items-center gap-2 mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Tillbaka till Spelet
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <GameNameForm groupId={groupId} gameId={gameId} initialName={game.name} />
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <BulkMatchSaveButton groupId={groupId} gameId={gameId} />
          <Link href={`/dashboard/groups/${groupId}/games/${gameId}/admin/predictions`} className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl sm:rounded-2xl font-black hover:bg-zinc-200 dark:hover:bg-zinc-700 transition shadow-sm text-[10px] sm:text-xs whitespace-nowrap leading-none border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Tippningar
          </Link>
          <Link href={`/dashboard/groups/${groupId}/games/${gameId}/admin/locks`} className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl sm:rounded-2xl font-black hover:bg-zinc-200 dark:hover:bg-zinc-700 transition shadow-sm text-[10px] sm:text-xs whitespace-nowrap leading-none border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            Låsningar
          </Link>
          <AdminActionButton
            action={bindedSync}
            label="Synka med API"
            icon={<RefreshCw className="w-4 h-4 shrink-0" />}
          />
        </div>
      </div>

      <div className="mb-8">
        <TabBar
          activeTab={activeTab}
          upcomingCount={upcomingMatches.length}
          playedCount={playedMatches.length}
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
        {matches.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 font-bold italic">
            {activeTab === 'upcoming' ? 'Inga kommande matcher.' : 'Inga spelade matcher ännu.'}
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Tid &amp; Info</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Match (Lagnamn)</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Resultat</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {matches.map(match => {
                const hasScoreConflict = match.provider_home_score !== null && (
                  match.final_home_score !== match.provider_home_score ||
                  match.final_away_score !== match.provider_away_score
                )
                const hasStatusConflict = match.provider_status && match.status !== match.provider_status
                const hasTeamConflict = match.provider_home_team && (
                  match.home_team !== match.provider_home_team ||
                  match.away_team !== match.provider_away_team
                )
                const hasConflict = hasScoreConflict || hasStatusConflict || hasTeamConflict

                return (
                  <Fragment key={match.id}>
                    <tr className={hasConflict ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''}>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                            {formatInTimeZone(new Date(match.kickoff_time), TIMEZONE, 'yyyy-MM-dd HH:mm')}
                          </span>
                          {match.is_manual_override && (
                            <span className="w-fit text-[10px] font-black uppercase tracking-widest bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">Manuell</span>
                          )}
                        </div>
                      </td>

                      <MatchResultForm
                        matchId={match.id}
                        homeScore={match.final_home_score}
                        awayScore={match.final_away_score}
                        status={match.status}
                        homeTeam={match.home_team}
                        awayTeam={match.away_team}
                        stage={match.stage}
                        teams={allTeams}
                        redCards={match.red_cards}
                        ownGoals={match.own_goals}
                        matchGoals={match.match_goals}
                      />

                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <form action={deleteMatch.bind(null, groupId, gameId, match.id)}>
                            <DeleteMatchButton />
                          </form>
                        </div>
                      </td>
                    </tr>
                    {hasConflict && (
                      <tr className="bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800/40">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span className="text-sm text-amber-800 dark:text-amber-300 font-semibold">
                                API förslår:
                                {hasTeamConflict && (
                                  <span className="font-black mr-2">
                                    {match.provider_home_team} - {match.provider_away_team}
                                  </span>
                                )}
                                {hasScoreConflict && (
                                  <span className="font-black">
                                    {match.provider_home_score ?? '?'} - {match.provider_away_score ?? '?'}
                                  </span>
                                )}
                                {hasStatusConflict && (
                                  <span className="ml-2">
                                    (status: <span className="font-black">{match.provider_status}</span>)
                                  </span>
                                )}
                              </span>
                              <ArrowRight className="w-3 h-3 text-amber-500" />
                              <span className="text-xs text-amber-600 dark:text-amber-400">Nu: {match.final_home_score ?? '?'} - {match.final_away_score ?? '?'} ({match.status})</span>
                            </div>
                            <form action={acceptApiResult.bind(null, groupId, gameId, match.id)}>
                              <button type="submit" className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-amber-600/20 whitespace-nowrap leading-none">
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                Tillämpa API
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
