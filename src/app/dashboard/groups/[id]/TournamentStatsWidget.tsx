'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ArrowRight } from 'lucide-react'
import { countryToFlag } from '@/lib/utils/flags'

interface Match {
  id: string
  game_id: string
  home_team: string
  away_team: string
  kickoff_time: string
  final_home_score: number | null
  final_away_score: number | null
  red_cards: number
  own_goals: number
  status: string
}

interface OwnGoalDetail {
  player_name: string
  team_name: string
  minute: number | null
  match_home: string
  match_away: string
  match_id: string
  game_id: string
}

interface TournamentStatsWidgetProps {
  totalRedCards: number
  totalOwnGoals: number
  matches: Match[]
  ownGoalDetails: OwnGoalDetail[]
  groupId: string
}

export function TournamentStatsWidget({
  totalRedCards,
  totalOwnGoals,
  matches,
  ownGoalDetails,
  groupId,
}: TournamentStatsWidgetProps) {
  const [activeModal, setActiveModal] = useState<'red_cards' | 'own_goals' | null>(null)

  // Prevent background scrolling when a modal is open
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [activeModal])

  // Filter matches that have red cards
  const matchesWithRedCards = matches
    .filter((m) => (m.red_cards || 0) > 0)
    .sort((a, b) => b.kickoff_time.localeCompare(a.kickoff_time))

  return (
    <>
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Red Cards Trigger Button */}
        <button
          onClick={() => totalRedCards > 0 && setActiveModal('red_cards')}
          disabled={totalRedCards === 0}
          className={`flex items-center gap-1.5 transition-all text-left outline-none ${
            totalRedCards > 0
              ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.97] group'
              : 'opacity-50 select-none'
          }`}
        >
          <span className="text-sm select-none transition-transform group-hover:rotate-12 duration-200">🟥</span>
          <span className="text-sm font-black text-red-600 dark:text-red-400 group-hover:underline underline-offset-2 decoration-red-500/50">
            {totalRedCards}
          </span>
          <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-0.5">
            Röda kort
            {totalRedCards > 0 && (
              <span className="text-[8px] text-zinc-300 dark:text-zinc-600 group-hover:text-red-500 transition-colors">
                ▼
              </span>
            )}
          </span>
        </button>

        <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />

        {/* Own Goals Trigger Button */}
        <button
          onClick={() => totalOwnGoals > 0 && setActiveModal('own_goals')}
          disabled={totalOwnGoals === 0}
          className={`flex items-center gap-1.5 transition-all text-left outline-none ${
            totalOwnGoals > 0
              ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.97] group'
              : 'opacity-50 select-none'
          }`}
        >
          <span className="text-sm select-none transition-transform group-hover:bounce duration-300">⚽</span>
          <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 group-hover:underline underline-offset-2 decoration-zinc-500/50">
            {totalOwnGoals}
          </span>
          <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-0.5">
            Självmål
            {totalOwnGoals > 0 && (
              <span className="text-[8px] text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors">
                ▼
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Modal/Overlay */}
      {activeModal && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[32px] border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl overflow-hidden flex flex-col h-fit max-h-[85vh] animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                  {activeModal === 'red_cards' ? 'Röda kort' : 'Självmål'}
                </h3>
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
                  {activeModal === 'red_cards'
                    ? `Totalt ${totalRedCards} st i turneringen`
                    : `Totalt ${totalOwnGoals} st i turneringen`}
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-950 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 max-h-[50vh] sm:max-h-[60vh] overscroll-contain scrollbar-thin">
              {activeModal === 'red_cards' ? (
                matchesWithRedCards.length > 0 ? (
                  matchesWithRedCards.map((match) => (
                    <Link
                      key={match.id}
                      href={`/dashboard/groups/${groupId}/games/${match.game_id}#match-${match.id}`}
                      onClick={() => setActiveModal(null)}
                      className="flex justify-between items-center p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/60 hover:border-red-500 dark:hover:border-red-500/50 hover:bg-red-50/20 dark:hover:bg-red-950/10 transition group cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          <span className="flex items-center gap-1 truncate">
                            <span className="text-base leading-none shrink-0">{countryToFlag(match.home_team) || '🏳️'}</span>
                            <span className="truncate">{match.home_team}</span>
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-700 font-medium shrink-0">-</span>
                          <span className="flex items-center gap-1 truncate">
                            <span className="text-base leading-none shrink-0">{countryToFlag(match.away_team) || '🏳️'}</span>
                            <span className="truncate">{match.away_team}</span>
                          </span>
                        </div>
                        <div className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider mt-0.5">
                          Visa match
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-black">
                          🟥 {match.red_cards}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-red-500 group-hover:translate-x-0.5 transition" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-6 text-zinc-500 dark:text-zinc-400 italic text-sm">
                    Inga röda kort registrerade.
                  </div>
                )
              ) : ownGoalDetails.length > 0 ? (
                ownGoalDetails.map((goal, idx) => (
                  <Link
                    key={idx}
                    href={`/dashboard/groups/${groupId}/games/${goal.game_id}#match-${goal.match_id}`}
                    onClick={() => setActiveModal(null)}
                    className="flex justify-between items-center p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/60 hover:border-indigo-500 dark:hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition group cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      {/* Player info */}
                      <div className="text-xs font-black text-zinc-900 dark:text-white truncate flex items-center gap-1">
                        <span className="text-base select-none shrink-0">⚽</span>
                        <span className="truncate">{goal.player_name}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold shrink-0">
                          ({goal.team_name})
                        </span>
                      </div>
                      {/* Match info */}
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold truncate mt-0.5 flex items-center gap-1">
                        <span className="shrink-0">{countryToFlag(goal.match_home) || '🏳️'}</span>
                        <span className="truncate">{goal.match_home}</span>
                        <span className="text-zinc-300 dark:text-zinc-700 font-medium shrink-0">-</span>
                        <span className="shrink-0">{countryToFlag(goal.match_away) || '🏳️'}</span>
                        <span className="truncate">{goal.match_away}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {goal.minute && (
                        <span className="font-black text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                          {goal.minute}&apos;
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-500 dark:text-zinc-400 italic text-sm">
                  Inga självmål registrerade.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
