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
  api_match_num: number | null
}

interface BracketViewProps {
  matches: Match[]
}

// ─── Layout constants ──────────────────────────────────────────────────────────
const CARD_H = 72        // px height of each match card
const CARD_W = 190       // px width of each match card
const SLOT_BASE = CARD_H + 10  // slot height for first round (card + gap), = 82px
const COL_GAP = 48       // px gap between columns (for connectors)
const HEADER_H = 52      // px for round title above bracket

// For round index r (0 = first round), the slot height doubles each round
function slotHeight(r: number) {
  return SLOT_BASE * Math.pow(2, r)
}

// Top position of match card i in round r
function cardTop(r: number, i: number) {
  const s = slotHeight(r)
  return i * s + (s - CARD_H) / 2
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isPlaceholder(name: string) {
  if (!name) return true
  return /^[WL]\d+$/.test(name) || name.includes('Winner') || name.includes('Loser') || name.toLowerCase() === 'tbd'
}

function getWinner(match: Match): string | null {
  if (match.status !== 'finished' || match.final_home_score === null || match.final_away_score === null) return null
  if (match.final_home_score > match.final_away_score) return match.home_team
  if (match.final_away_score > match.final_home_score) return match.away_team
  return null
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ match }: { match: Match }) {
  const winner = getWinner(match)
  const isFinished = match.status === 'finished'

  const renderTeam = (team: string, score: number | null, isWon: boolean | null) => {
    const isPholder = isPlaceholder(team)
    return (
      <div className={`flex items-center gap-2 px-2.5 py-2 ${
        isWon === true ? 'bg-emerald-50 dark:bg-emerald-900/20' : isWon === false ? 'opacity-40' : ''
      }`} style={{ height: CARD_H / 2 }}>
        <span className={`text-base ${isPholder ? 'opacity-20' : ''}`}>
          {isPholder ? '🏳️' : countryToFlag(team)}
        </span>
        <span className={`flex-1 text-[11px] font-bold truncate ${
          isPholder
            ? 'text-zinc-300 dark:text-zinc-600 italic'
            : isWon === true
            ? 'text-emerald-700 dark:text-emerald-300'
            : 'text-zinc-800 dark:text-zinc-200'
        }`}>
          {isPholder ? '—' : team}
        </span>
        {isFinished && (
          <span className={`text-sm font-black min-w-[20px] text-right ${
            isWon === true ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-400'
          }`}>
            {score ?? '-'}
          </span>
        )}
      </div>
    )
  }

  const homeWon = isFinished ? winner === match.home_team : null
  const awayWon = isFinished ? winner === match.away_team : null
  const hasRealTeams = !isPlaceholder(match.home_team) || !isPlaceholder(match.away_team)

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-sm border ${
        isFinished
          ? 'border-zinc-200 dark:border-zinc-700'
          : hasRealTeams
          ? 'border-indigo-300 dark:border-indigo-700 shadow-indigo-100/50'
          : 'border-dashed border-zinc-200 dark:border-zinc-700'
      } bg-white dark:bg-zinc-900`}
      style={{ width: CARD_W, height: CARD_H }}
    >
      {renderTeam(match.home_team, match.final_home_score, homeWon)}
      <div className="border-t border-zinc-100 dark:border-zinc-800" />
      {renderTeam(match.away_team, match.final_away_score, awayWon)}
    </div>
  )
}

// ─── Connector SVG between rounds ─────────────────────────────────────────────
// Draws lines from two cards in round r to one card in round r+1
function ConnectorColumn({ roundIdx, matchCount, totalH }: { roundIdx: number; matchCount: number; totalH: number }) {
  const paths: string[] = []
  const stroke = '#d1d5db' // zinc-300

  for (let i = 0; i < matchCount; i++) {
    // Two source cards (round r, indices 2i and 2i+1) → one dest card (round r+1, index i)
    const y1 = cardTop(roundIdx, 2 * i) + CARD_H / 2
    const y2 = cardTop(roundIdx, 2 * i + 1) + CARD_H / 2
    const yMid = cardTop(roundIdx + 1, i) + CARD_H / 2
    const mx = COL_GAP / 2

    paths.push(
      // Upper arm: from right of upper card → elbow → right of gap at midpoint
      `M 0 ${y1} H ${mx} V ${yMid} H ${COL_GAP}`,
      // Lower arm: from right of lower card → elbow → right of gap at midpoint
      `M 0 ${y2} H ${mx} V ${yMid}`,
    )
  }

  return (
    <svg
      width={COL_GAP}
      height={totalH}
      style={{ flexShrink: 0, display: 'block', marginTop: HEADER_H }}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      ))}
    </svg>
  )
}

// ─── Round Column ─────────────────────────────────────────────────────────────
function RoundColumn({
  label,
  emoji,
  matches,
  roundIdx,
  totalH,
}: {
  label: string
  emoji: string
  matches: Match[]
  roundIdx: number
  totalH: number
}) {
  return (
    <div style={{ width: CARD_W, flexShrink: 0 }}>
      {/* Header */}
      <div className="text-center mb-0" style={{ height: HEADER_H }}>
        <div className="text-xl">{emoji}</div>
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-tight">{label}</div>
        <div className="text-[10px] text-zinc-300 dark:text-zinc-600">{matches.length} matcher</div>
      </div>
      {/* Cards container - relative, fixed height */}
      <div className="relative" style={{ height: totalH }}>
        {matches.map((m, i) => (
          <div
            key={m.id}
            className="absolute left-0"
            style={{ top: cardTop(roundIdx, i) }}
          >
            <MatchCard match={m} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function BracketView({ matches }: BracketViewProps) {
  // Define the exact visual order from top to bottom based on FIFA 2026 bracket structure
  const visualOrderR32 = [73, 77, 74, 75, 80, 82, 81, 84, 86, 87, 78, 79, 83, 85, 76, 88]
  const visualOrderR16 = [89, 90, 93, 94, 91, 92, 95, 96]
  const visualOrderQF  = [97, 98, 99, 100]
  const visualOrderSF  = [101, 102]

  // Helper to sort by visual order or fallback to ID
  const sortByOrder = (matchList: Match[], orderArr: number[]) => {
    return [...matchList].sort((a, b) => {
      const aIdx = a.api_match_num ? orderArr.indexOf(a.api_match_num) : -1
      const bIdx = b.api_match_num ? orderArr.indexOf(b.api_match_num) : -1
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
      // Fallback
      return a.id.localeCompare(b.id)
    })
  }

  const ro32 = sortByOrder(matches.filter(m => m.stage === 'Round of 32'), visualOrderR32)
  const ro16 = sortByOrder(matches.filter(m => m.stage === 'Round of 16'), visualOrderR16)
  const qf   = sortByOrder(matches.filter(m => m.stage === 'Quarter-final'), visualOrderQF)
  const sf   = sortByOrder(matches.filter(m => m.stage === 'Semi-final'), visualOrderSF)
  const third = matches.filter(m => m.stage === 'Match for third place')
  const final = matches.filter(m => m.stage === 'Final')


  // Build the ordered list of rounds that have data
  const allRounds: { label: string; emoji: string; matches: Match[] }[] = []
  if (ro32.length > 0) allRounds.push({ label: 'Sextondelsfinal', emoji: '⚽', matches: ro32 })
  if (ro16.length > 0) allRounds.push({ label: 'Åttondelsfinal', emoji: '⚔️', matches: ro16 })
  if (qf.length > 0)   allRounds.push({ label: 'Kvartsfinal', emoji: '🔥', matches: qf })
  if (sf.length > 0)   allRounds.push({ label: 'Semifinal', emoji: '⭐', matches: sf })
  if (final.length > 0) allRounds.push({ label: 'Final', emoji: '🏆', matches: final })

  if (allRounds.length === 0) {
    return (
      <div className="p-20 text-center text-zinc-400 font-bold italic bg-zinc-50 dark:bg-zinc-900/50 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
        Inga slutspelsmatcher är registrerade ännu.
      </div>
    )
  }

  // Total height driven by the first (largest) round
  const firstRoundCount = allRounds[0].matches.length
  const totalH = firstRoundCount * SLOT_BASE

  const finalMatch = final[0]
  const champion = finalMatch ? getWinner(finalMatch) : null
  const thirdWinner = third[0] ? getWinner(third[0]) : null

  return (
    <div className="space-y-8">
      {/* Champion Banner */}
      {champion && (
        <div className="flex items-center justify-center gap-4 bg-gradient-to-r from-amber-400 to-yellow-300 dark:from-amber-600 dark:to-yellow-500 p-6 rounded-3xl shadow-xl shadow-amber-200/50 dark:shadow-amber-900/30">
          <Trophy className="w-10 h-10 text-amber-800 dark:text-amber-100" />
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-800/70">VM 2026 Vinnare</p>
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
            <h3 className="font-black text-zinc-700 dark:text-zinc-300 text-sm uppercase tracking-wider">Bronsmatch</h3>
            {thirdWinner && (
              <span className="ml-auto text-sm font-bold text-amber-600 dark:text-amber-400">
                🥉 {countryToFlag(thirdWinner)} {thirdWinner}
              </span>
            )}
          </div>
          <MatchCard match={third[0]} />
        </div>
      )}

      {/* Main Bracket */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
          <Swords className="w-5 h-5 text-indigo-500" />
          <h2 className="font-black text-zinc-900 dark:text-white">Slutspelsbracket</h2>
          <span className="text-xs text-zinc-400 ml-auto">← Scrolla horisontellt →</span>
        </div>
        <div className="overflow-x-auto p-6">
          <div className="flex items-start" style={{ minWidth: 'max-content' }}>
            {allRounds.map((round, rIdx) => (
              <div key={round.label} className="flex items-start">
                <RoundColumn
                  label={round.label}
                  emoji={round.emoji}
                  matches={round.matches}
                  roundIdx={rIdx}
                  totalH={totalH}
                />
                {/* Connector between this round and next */}
                {rIdx < allRounds.length - 1 && (
                  <ConnectorColumn
                    roundIdx={rIdx}
                    matchCount={allRounds[rIdx + 1].matches.length}
                    totalH={totalH}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 text-xs text-zinc-400 px-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span>Vinnare/Vidare</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-dashed border-zinc-300" />
          <span>Väntar på match</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-300" />
          <span>Kommande</span>
        </div>
      </div>
    </div>
  )
}
