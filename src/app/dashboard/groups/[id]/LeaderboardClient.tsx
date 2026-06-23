'use client'

import { useState, Fragment } from 'react'
import { ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react'
import { countryToFlag } from '@/lib/utils/flags'

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
}

interface Match {
  id: string
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

interface LeaderboardClientProps {
  rankedLeaderboard: LeaderboardEntry[]
  currentUserId: string
  focusMatches: Match[]
  predictions: Prediction[]
  hide24hPoints: boolean
  isResetState: boolean
  focusDayLabel: string
}

function getPointBadgeColor(diff: number) {
  if (diff >= 7) {
    return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 animate-pulse shadow-sm shadow-amber-500/10"
  } else if (diff >= 5) {
    return "text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-100 dark:border-fuchsia-500/20"
  } else if (diff >= 3) {
    return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20"
  } else {
    return "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border-sky-100 dark:border-sky-500/20"
  }
}

export function LeaderboardClient({
  rankedLeaderboard,
  currentUserId,
  focusMatches,
  predictions,
  hide24hPoints,
  isResetState,
  focusDayLabel
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
              const pointDiff = entry.previous_points !== undefined && entry.previous_points !== null
                ? entry.total_points - entry.previous_points
                : 0

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
                            {pointDiff > 0 && (
                              <div className={`flex items-center font-black text-[10px] px-1.5 py-0.5 rounded-full border ${getPointBadgeColor(pointDiff)}`} title={`+${pointDiff} poäng sedan förra uppdateringen`}>
                                <span>+{pointDiff}p</span>
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
                          {focusMatches.length === 0 ? (
                            <div className="text-xs italic text-zinc-400 p-2">Inga matcher registrerade för denna matchdag.</div>
                          ) : (
                            <div className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40">
                              {focusMatches.map(match => {
                                const pred = predictions.find(p => p.user_id === entry.user_id && p.match_id === match.id)
                                const points = pred?.points_awarded ?? 0
                                const isFinished = match.status === 'finished'
                                const isLive = match.status === 'live'
                                
                                return (
                                  <div key={match.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="shrink-0 text-base" role="img" aria-label={match.home_team}>
                                        {countryToFlag(match.home_team) || '🏳️'}
                                      </span>
                                      <span className="truncate max-w-[80px] sm:max-w-none">{match.home_team}</span>
                                      <span className="text-zinc-400 font-normal">vs</span>
                                      <span className="shrink-0 text-base" role="img" aria-label={match.away_team}>
                                        {countryToFlag(match.away_team) || '🏳️'}
                                      </span>
                                      <span className="truncate max-w-[80px] sm:max-w-none">{match.away_team}</span>
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
