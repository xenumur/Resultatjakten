'use client'

import { countryToFlag } from '@/lib/utils/flags'
import { Trophy, Shield, Swords } from 'lucide-react'

interface Match {
  id: string
  stage: string
  home_team: string
  away_team: string
  final_home_score: number | null
  final_away_score: number | null
  status: string
}

interface BracketViewProps {
  matches: Match[]
}

function isPlaceholder(name: string) {
  if (!name) return true
  return /^[WL]\d+$/.test(name) || name.includes('Winner') || name.includes('Loser') || name.toLowerCase() === 'tbd'
}

function getWinner(match: Match): string | null {
  if (match.status !== 'finished' || match.final_home_score === null || match.final_away_score === null) return null
  if (match.final_home_score > match.final_away_score) return match.home_team
  if (match.final_away_score > match.final_home_score) return match.away_team
  return null // draw (shouldn't happen in knockout)
}

function MatchCard({ match, size = 'md' }: { match: Match; size?: 'sm' | 'md' | 'lg' }) {
  const winner = getWinner(match)
  const isFinished = match.status === 'finished'
  const homePlaceholder = isPlaceholder(match.home_team)
  const awayPlaceholder = isPlaceholder(match.away_team)

  const teamNameClass = size === 'lg'
    ? 'text-sm font-black'
    : size === 'md'
    ? 'text-xs font-bold'
    : 'text-[11px] font-bold'

  const scoreClass = size === 'lg'
    ? 'text-lg font-black min-w-[24px] text-center'
    : size === 'md'
    ? 'text-sm font-black min-w-[20px] text-center'
    : 'text-xs font-black min-w-[18px] text-center'

  const flagClass = size === 'lg' ? 'text-xl' : 'text-base'

  const renderTeam = (teamName: string, score: number | null, isWinner: boolean | null) => {
    const isPholder = isPlaceholder(teamName)
    return (
      <div className={`flex items-center gap-2 px-3 py-2.5 ${
        isWinner === true
          ? 'bg-emerald-50 dark:bg-emerald-900/20'
          : isWinner === false
          ? 'opacity-50'
          : ''
      }`}>
        {isPholder ? (
          <span className="text-zinc-300 dark:text-zinc-600 text-base">?</span>
        ) : (
          <span className={flagClass}>{countryToFlag(teamName)}</span>
        )}
        <span className={`flex-1 truncate ${teamNameClass} ${
          isPholder
            ? 'text-zinc-300 dark:text-zinc-600 italic'
            : isWinner === true
            ? 'text-emerald-700 dark:text-emerald-300'
            : 'text-zinc-800 dark:text-zinc-200'
        }`}>
          {isPholder ? (teamName || 'TBD') : teamName}
        </span>
        {isFinished && (
          <span className={`${scoreClass} ${
            isWinner === true
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-zinc-400'
          }`}>
            {score ?? '-'}
          </span>
        )}
      </div>
    )
  }

  const homeWon = winner === match.home_team
  const awayWon = winner === match.away_team

  return (
    <div className={`
      bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-sm
      ${isFinished
        ? 'border-zinc-200 dark:border-zinc-800'
        : homePlaceholder || awayPlaceholder
        ? 'border-dashed border-zinc-200 dark:border-zinc-800'
        : 'border-indigo-200 dark:border-indigo-800 shadow-indigo-100/50 dark:shadow-indigo-900/20'
      }
      ${size === 'lg' ? 'min-w-[200px]' : size === 'md' ? 'min-w-[170px]' : 'min-w-[150px]'}
    `}>
      {renderTeam(match.home_team, match.final_home_score, isFinished ? homeWon : null)}
      <div className="border-t border-zinc-100 dark:border-zinc-800" />
      {renderTeam(match.away_team, match.final_away_score, isFinished ? awayWon : null)}
    </div>
  )
}

function RoundColumn({ title, matches, size, emoji }: {
  title: string
  matches: Match[]
  size?: 'sm' | 'md' | 'lg'
  emoji?: string
}) {
  if (matches.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <div className="text-center mb-3">
        {emoji && <div className="text-2xl mb-1">{emoji}</div>}
        <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">{title}</h3>
        <p className="text-[10px] text-zinc-300 dark:text-zinc-600">{matches.length} matcher</p>
      </div>
      <div className="flex flex-col justify-around flex-1 gap-4">
        {matches.map(m => (
          <MatchCard key={m.id} match={m} size={size} />
        ))}
      </div>
    </div>
  )
}

export function BracketView({ matches }: BracketViewProps) {
  const ro32 = matches.filter(m => m.stage === 'Round of 32')
  const ro16 = matches.filter(m => m.stage === 'Round of 16')
  const qf = matches.filter(m => m.stage === 'Quarter-final')
  const sf = matches.filter(m => m.stage === 'Semi-final')
  const third = matches.filter(m => m.stage === 'Match for third place')
  const final = matches.filter(m => m.stage === 'Final')

  const roundsWithData = [ro32, ro16, qf, sf, final].filter(r => r.length > 0)

  if (roundsWithData.length === 0) {
    return (
      <div className="p-20 text-center text-zinc-400 font-bold italic bg-zinc-50 dark:bg-zinc-900/50 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
        Inga slutspelsmatcher är registrerade ännu.
      </div>
    )
  }

  // Find the champion
  const finalMatch = final[0]
  const champion = finalMatch ? getWinner(finalMatch) : null
  const thirdPlaceWinner = third[0] ? getWinner(third[0]) : null

  return (
    <div className="space-y-8">
      {/* Champion Banner */}
      {champion && (
        <div className="flex items-center justify-center gap-4 bg-gradient-to-r from-amber-400 to-yellow-300 dark:from-amber-600 dark:to-yellow-500 p-6 rounded-3xl shadow-xl shadow-amber-200/50 dark:shadow-amber-900/30">
          <Trophy className="w-10 h-10 text-amber-800 dark:text-amber-100" />
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-800/70 dark:text-amber-100/70">VM 2026 Vinnare</p>
            <p className="text-3xl font-black text-amber-900 dark:text-amber-50">
              {countryToFlag(champion)} {champion}
            </p>
          </div>
          <Trophy className="w-10 h-10 text-amber-800 dark:text-amber-100" />
        </div>
      )}

      {/* Third Place */}
      {third.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-zinc-700 dark:text-zinc-300 text-sm uppercase tracking-wider">
              Bronsmatch
            </h3>
            {thirdPlaceWinner && (
              <span className="ml-auto text-sm font-bold text-amber-600 dark:text-amber-400">
                🥉 {countryToFlag(thirdPlaceWinner)} {thirdPlaceWinner}
              </span>
            )}
          </div>
          <div className="flex gap-4">
            {third.map(m => <MatchCard key={m.id} match={m} size="md" />)}
          </div>
        </div>
      )}

      {/* Main Bracket - horizontal scroll */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
          <Swords className="w-5 h-5 text-indigo-500" />
          <h2 className="font-black text-zinc-900 dark:text-white">Slutspelsbracket</h2>
        </div>
        <div className="overflow-x-auto p-6">
          <div className="flex items-start gap-10 min-w-max">
            {ro32.length > 0 && (
              <RoundColumn title="Sextondelsfinal" matches={ro32} size="sm" emoji="⚽" />
            )}
            {ro16.length > 0 && (
              <RoundColumn title="Åttondelsfinal" matches={ro16} size="sm" emoji="⚔️" />
            )}
            {qf.length > 0 && (
              <RoundColumn title="Kvartsfinal" matches={qf} size="md" emoji="🔥" />
            )}
            {sf.length > 0 && (
              <RoundColumn title="Semifinal" matches={sf} size="md" emoji="⭐" />
            )}
            {final.length > 0 && (
              <RoundColumn title="Final" matches={final} size="lg" emoji="🏆" />
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 px-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span>Vinnare/Vidare</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-dashed border-zinc-300" />
          <span>Väntar på match</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-400" />
          <span>Pågående/Kommande</span>
        </div>
      </div>
    </div>
  )
}
