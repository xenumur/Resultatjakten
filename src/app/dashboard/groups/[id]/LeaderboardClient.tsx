'use client'

import { useState, Fragment } from 'react'
import { ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react'
import { countryToFlag } from '@/lib/utils/flags'
import Link from 'next/link'

interface LeaderboardEntry {
  user_id: string
  display_name: string
  match_points: number
  knockout_points: number
  bonus_points: number
  total_points: number
  points_24h: number
  is_paid: boolean
  rank: number
  previous_rank?: number | null
  previous_points?: number | null
  last_match_points?: number
  has_last_match?: boolean
}

interface Match {
  id: string
  game_id: string
  home_team: string
  away_team: string
  kickoff_time: string
  status: string
  final_home_score: number | null
  final_away_score: number | null
}

interface Prediction {
  user_id: string
  match_id: string
  points_awarded: number | null
}

interface FocusBonusAnswer {
  user_id: string
  question_text: string
  points_awarded: number
}

interface FocusKnockoutPrediction {
  user_id: string
  round: string
  team_name: string
  points_awarded: number
}

interface LeaderboardClientProps {
  rankedLeaderboard: LeaderboardEntry[]
  currentUserId: string
  focusMatches: Match[]
  predictions: Prediction[]
  focusBonusAnswers: FocusBonusAnswer[]
  focusKnockoutPredictions: FocusKnockoutPrediction[]
  hide24hPoints: boolean
  hideMeBadge: boolean
  hideLastMatchPoints: boolean
  isResetState: boolean
  focusDayLabel: string
  groupId: string
}

const ENABLE_MATCH_LINKS = true

export function LeaderboardClient({
  rankedLeaderboard,
  currentUserId,
  focusMatches,
  predictions,
  focusBonusAnswers,
  focusKnockoutPredictions,
  hide24hPoints,
  hideMeBadge,
  hideLastMatchPoints,
  isResetState,
  focusDayLabel,
  groupId
}: LeaderboardClientProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  const toggleRow = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId)
  }

  return (
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
              const isMe = entry.user_id === currentUserId
              const isExpanded = expandedUserId === entry.user_id
              const userBonus = focusBonusAnswers.filter(b => b.user_id === entry.user_id)
              const userKnockout = focusKnockoutPredictions.filter(k => k.user_id === entry.user_id)
              
              // Group knockout predictions by round
              const groupedKnockout = userKnockout.reduce((acc, current) => {
                const existing = acc.find(item => item.round === current.round)
                if (existing) {
                  existing.teams.push(current.team_name)
                  existing.points += current.points_awarded
                } else {
                  acc.push({
                    round: current.round,
                    teams: [current.team_name],
                    points: current.points_awarded
                  })
                }
                return acc
              }, [] as { round: string; teams: string[]; points: number }[])

              const hasItems = focusMatches.length > 0 || userBonus.length > 0 || groupedKnockout.length > 0

              return (
                <Fragment key={entry.user_id}>
                  <tr
                    onClick={() => toggleRow(entry.user_id)}
                    className={`transition-colors group cursor-pointer select-none ${isMe ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}
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
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 md:gap-2 text-sm">
                            <span className="truncate max-w-[80px] xs:max-w-[100px] sm:max-w-none">{entry.display_name}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            )}
                            {isMe && !hideMeBadge && <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-600 text-white px-1.5 py-0.5 rounded shrink-0">Du</span>}
                          </div>
                          {((!isResetState && entry.previous_rank && entry.rank !== entry.previous_rank) || (!hideLastMatchPoints && entry.has_last_match && entry.last_match_points !== undefined)) ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {/* Rank change badge */}
                              {!isResetState && entry.previous_rank && entry.rank < entry.previous_rank && (
                                <div className="flex items-center gap-0.5 text-emerald-500 font-black text-[9px] bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-100 dark:border-emerald-500/20 shrink-0">
                                  <ArrowUp className="w-2 h-2 shrink-0" />
                                  <span>{entry.previous_rank - entry.rank}</span>
                                </div>
                              )}
                              {!isResetState && entry.previous_rank && entry.rank > entry.previous_rank && (
                                <div className="flex items-center gap-0.5 text-red-500 font-black text-[9px] bg-red-50 dark:bg-red-500/10 px-1.5 py-0.2 rounded border border-red-100 dark:border-red-500/20 shrink-0">
                                  <ArrowDown className="w-2 h-2 shrink-0" />
                                  <span>{entry.rank - entry.previous_rank}</span>
                                </div>
                              )}

                              {/* Latest match points badge */}
                              {!isResetState && !hideLastMatchPoints && entry.has_last_match && entry.last_match_points !== undefined && (
                                <div className={`flex items-center justify-center font-black text-[9px] px-1.5 py-0.2 rounded border shrink-0 select-none ${
                                  entry.last_match_points >= 7
                                    ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20'
                                    : entry.last_match_points >= 5
                                      ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
                                      : entry.last_match_points >= 3
                                        ? 'bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20'
                                        : entry.last_match_points >= 2
                                          ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20'
                                          : 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20'
                                }`} title={`Senaste matchen: +${entry.last_match_points}p`}>
                                  {entry.last_match_points > 0 ? `+${entry.last_match_points}p` : '0p'}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-1.5 md:py-5 md:px-6 text-center font-bold text-zinc-500 text-[11px] md:text-xs">{entry.match_points}</td>
                    <td className="py-3 px-1.5 md:py-5 md:px-6 text-center font-bold text-zinc-500 text-[11px] md:text-xs">{entry.knockout_points}</td>
                    <td className="py-3 px-1.5 md:py-5 md:px-6 text-center font-bold text-amber-600 dark:text-amber-400 text-[11px] md:text-xs">{entry.bonus_points}</td>
                    <td className="py-3 pl-2 pr-4 md:py-5 md:px-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-base md:text-xl font-black ${isTop3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'}`}>
                          {entry.total_points}
                        </span>
                        {!hide24hPoints && !isResetState && entry.points_24h > 0 && (
                          <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-1.5 py-0.5 rounded mt-0.5 select-none whitespace-nowrap" title={`Poäng intjänade ${focusDayLabel}`}>
                            +{entry.points_24h}p {focusDayLabel}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-zinc-50/40 dark:bg-zinc-950/20">
                      <td colSpan={6} className="px-4 py-4 md:px-6 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="bg-zinc-100/50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-200/50 dark:border-zinc-800/80 space-y-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
                            {focusDayLabel === 'idag'
                              ? 'Dagens matcher & poäng'
                              : focusDayLabel === 'igår'
                                ? 'Gårdagens matcher & poäng'
                                : `Matcher & poäng (${focusDayLabel})`}
                          </div>
                          {!hasItems ? (
                            <div className="text-xs italic text-zinc-400 p-2">Inga matcher eller poäng registrerade för denna matchdag.</div>
                          ) : (
                            <div className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40">
                              {focusMatches.map(match => {
                                const pred = predictions.find(p => p.user_id === entry.user_id && p.match_id === match.id)
                                const points = pred?.points_awarded ?? 0
                                const isFinished = match.status === 'finished' || (match.final_home_score !== null && match.final_away_score !== null)
                                const isLive = match.status === 'live' || (new Date(match.kickoff_time).getTime() <= Date.now() && !isFinished)

                                const rowContent = (
                                  <>
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="shrink-0 text-base" role="img" aria-label={match.home_team}>
                                        {countryToFlag(match.home_team) || '🏳️'}
                                      </span>
                                      <span className={`truncate max-w-[80px] sm:max-w-none ${ENABLE_MATCH_LINKS ? 'group-hover/match:text-indigo-600 dark:group-hover/match:text-indigo-400 transition-colors' : ''}`}>{match.home_team}</span>
                                      <span className="text-zinc-400 font-normal">vs</span>
                                      <span className="shrink-0 text-base" role="img" aria-label={match.away_team}>
                                        {countryToFlag(match.away_team) || '🏳️'}
                                      </span>
                                      <span className={`truncate max-w-[80px] sm:max-w-none ${ENABLE_MATCH_LINKS ? 'group-hover/match:text-indigo-600 dark:group-hover/match:text-indigo-400 transition-colors' : ''}`}>{match.away_team}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 shrink-0">
                                      {isFinished ? (
                                        <span className="font-black bg-zinc-200/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded text-[11px]">
                                          {match.final_home_score} – {match.final_away_score}
                                        </span>
                                      ) : isLive ? (
                                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded animate-pulse uppercase tracking-wider">
                                          Live
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-extrabold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase">
                                          Kommande
                                        </span>
                                      )}
                                      
                                      <div className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                        points > 0
                                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30'
                                          : 'bg-zinc-50 text-zinc-400 border-zinc-100 dark:bg-zinc-900/20 dark:text-zinc-500 dark:border-zinc-800/30'
                                      }`}>
                                        {points > 0 ? `+${points}p` : '0p'}
                                      </div>
                                    </div>
                                  </>
                                )

                                if (ENABLE_MATCH_LINKS) {
                                  return (
                                    <Link
                                      key={match.id}
                                      href={`/dashboard/groups/${groupId}/games/${match.game_id}#match-${match.id}`}
                                      className="py-2.5 px-3 -mx-3 rounded-xl flex items-center justify-between gap-4 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 cursor-pointer group/match"
                                    >
                                      {rowContent}
                                    </Link>
                                  )
                                }

                                return (
                                  <div
                                    key={match.id}
                                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                                  >
                                    {rowContent}
                                  </div>
                                )
                              })}

                              {userBonus.map((b, idx) => (
                                <div
                                  key={`bonus-${idx}`}
                                  className="py-2.5 flex items-center justify-between gap-4 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="shrink-0 text-sm">🏆</span>
                                    <span className="truncate text-zinc-400 dark:text-zinc-500 font-normal">Bonus:</span>
                                    <span className="truncate" title={b.question_text}>{b.question_text}</span>
                                  </div>
                                  <div className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30 shrink-0">
                                    +{b.points_awarded}p
                                  </div>
                                </div>
                              ))}

                              {groupedKnockout.map((g, idx) => {
                                const roundLabel = g.round === 'round_of_16'
                                  ? 'Åttondel'
                                  : g.round === 'quarter_final'
                                    ? 'Kvartsfinal'
                                    : g.round === 'semi_final'
                                      ? 'Semifinal'
                                      : g.round === 'third_place'
                                        ? 'Bronsmatch'
                                        : g.round === 'final'
                                          ? 'Final'
                                          : g.round;

                                return (
                                  <div
                                    key={`ko-${idx}`}
                                    className="py-2.5 flex items-center justify-between gap-4 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="shrink-0 text-sm">🏅</span>
                                      <span className="truncate text-zinc-400 dark:text-zinc-500 font-normal shrink-0">{roundLabel}:</span>
                                      <span className="flex items-center gap-1.5 flex-wrap min-w-0">
                                        {g.teams.map((team, tIdx) => (
                                          <span
                                            key={tIdx}
                                            className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-lg text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50"
                                          >
                                            <span className="text-xs leading-none shrink-0" role="img" aria-label={team}>
                                              {countryToFlag(team) || '🏳️'}
                                            </span>
                                            {team}
                                          </span>
                                        ))}
                                      </span>
                                    </div>
                                    <div className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30 shrink-0">
                                      +{g.points}p
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {rankedLeaderboard.length === 0 && (
        <div className="p-16 text-center text-zinc-400 font-black text-sm italic uppercase tracking-widest">
          Ingen data ännu.
        </div>
      )}
    </div>
  )
}
