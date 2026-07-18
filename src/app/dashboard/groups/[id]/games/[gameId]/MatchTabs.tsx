'use client'

import { formatInTimeZone } from 'date-fns-tz'
import { countryToFlag } from '@/lib/utils/flags'
import { useState, useEffect } from 'react'
import { Clock, CheckCircle2, Flame, Search, X } from 'lucide-react'
import { compareStages } from '@/lib/utils/stages'

const TIMEZONE = 'Europe/Stockholm'

interface Goal {
  id: string
  player_name: string
  team_name: string
  minute: number | null
  offset_minute: number | null
  is_penalty: boolean
  is_own_goal: boolean
}

interface Match {
  id: string
  home_team: string
  away_team: string
  kickoff_time: string
  status: string
  final_home_score: number | null
  final_away_score: number | null
  ot_home_score?: number | null
  ot_away_score?: number | null
  penalty_home_score?: number | null
  penalty_away_score?: number | null
  stage: string | null
  group_name: string | null
  venue: string | null
  broadcaster: string | null
  match_goals?: Goal[]
}

interface Prediction {
  match_id: string
  predicted_home_score: number
  predicted_away_score: number
  points_awarded: number | null
}

interface MatchTabsProps {
  matches: Match[]
  predictionMap: Map<string, Prediction>
}

function MatchItem({ match, prediction }: { match: Match; prediction?: Prediction }) {
  const isFinished = match.status === 'finished' || (match.final_home_score !== null && match.final_away_score !== null)
  const [isLive, setIsLive] = useState(match.status === 'live')

  useEffect(() => {
    const timer = setTimeout(() => {
      const live = match.status === 'live' || (new Date(match.kickoff_time).getTime() <= Date.now() && !isFinished)
      setIsLive(live)
    }, 0)
    return () => clearTimeout(timer)
  }, [match.status, match.kickoff_time, isFinished])

  const hasPoints = isFinished && prediction && prediction.points_awarded !== null

  // Gruppera mål
  const homeGoals = (match.match_goals || []).filter(g => g.team_name === match.home_team)
  const awayGoals = (match.match_goals || []).filter(g => g.team_name === match.away_team)

  return (
    <li
      id={`match-${match.id}`}
      className="scroll-mt-24 target:ring-2 target:ring-indigo-500 p-4 md:p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:justify-between gap-4"
    >
      {/* Left: teams + meta */}
      <div className="flex flex-col items-center md:items-start w-full md:w-auto">
        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-2 flex items-center gap-2 flex-wrap justify-center md:justify-start">
          <span>{formatInTimeZone(new Date(match.kickoff_time), TIMEZONE, 'yyyy-MM-dd HH:mm')}</span>
          {match.venue && <span className="text-zinc-400">• {match.venue}</span>}
          {match.broadcaster && (
            <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded text-[10px] font-black uppercase tracking-tighter border border-zinc-200 dark:border-zinc-700">
              {match.broadcaster}
            </span>
          )}
        </p>
        <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4 text-base md:text-lg font-bold">
          <span className="w-28 md:w-40 text-right flex items-center justify-end gap-2">
            {match.home_team}
            <span className="text-xl md:text-2xl shrink-0">{countryToFlag(match.home_team)}</span>
          </span>
          <span className="px-2 md:px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-500 text-xs md:text-sm shrink-0">vs</span>
          <span className="w-28 md:w-40 text-left flex items-center justify-start gap-2">
            <span className="text-xl md:text-2xl shrink-0">{countryToFlag(match.away_team)}</span>
            {match.away_team}
          </span>
        </div>

        {/* Målskyttar för spelad match */}
        {isFinished && (homeGoals.length > 0 || awayGoals.length > 0) && (
          <div className="mt-2.5 flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium justify-center md:justify-start w-full">
            {homeGoals.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap justify-center md:justify-start">
                <span className="text-[14px] leading-none shrink-0">{countryToFlag(match.home_team)}</span>
                <span className="italic flex items-center gap-1.5 flex-wrap">
                  {homeGoals.map((g, idx) => (
                    <span key={g.id || idx} className="inline-flex items-center gap-0.5">
                      <span>{g.player_name}</span>
                      <span className="text-[10px] text-zinc-450 dark:text-zinc-550 font-normal">
                        {g.minute ? ` ${g.minute}'` : ''}
                        {g.is_penalty && ' (str)'}
                        {g.is_own_goal && (
                          <span className="ml-1 text-[9px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1 py-0.2 rounded border border-rose-100 dark:border-rose-900/30">
                            självmål
                          </span>
                        )}
                      </span>
                      {idx < homeGoals.length - 1 && <span className="mr-1 text-zinc-300 dark:text-zinc-700">,</span>}
                    </span>
                  ))}
                </span>
              </div>
            )}
            {homeGoals.length > 0 && awayGoals.length > 0 && (
              <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">|</span>
            )}
            {awayGoals.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap justify-center md:justify-start">
                <span className="text-[14px] leading-none shrink-0">{countryToFlag(match.away_team)}</span>
                <span className="italic flex items-center gap-1.5 flex-wrap">
                  {awayGoals.map((g, idx) => (
                    <span key={g.id || idx} className="inline-flex items-center gap-0.5">
                      <span>{g.player_name}</span>
                      <span className="text-[10px] text-zinc-450 dark:text-zinc-550 font-normal">
                        {g.minute ? ` ${g.minute}'` : ''}
                        {g.is_penalty && ' (str)'}
                        {g.is_own_goal && (
                          <span className="ml-1 text-[9px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1 py-0.2 rounded border border-rose-100 dark:border-rose-900/30">
                            självmål
                          </span>
                        )}
                      </span>
                      {idx < awayGoals.length - 1 && <span className="mr-1 text-zinc-300 dark:text-zinc-700">,</span>}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Prediction tip (only shown, no duplicate points badge here) */}
        {prediction && (
          <div className="mt-2">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-800/50 inline-block">
              Ditt tips: {prediction.predicted_home_score} – {prediction.predicted_away_score}
            </div>
          </div>
        )}
      </div>

      {/* Right: score + points */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        {isLive ? (
          <span className="px-4 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] md:text-xs font-black rounded-full uppercase tracking-widest animate-pulse flex items-center gap-1.5">
            <Flame className="w-3 h-3" /> Live
          </span>
        ) : isFinished ? (
          <>
            <div className="text-center font-black text-xl md:text-2xl bg-zinc-100 dark:bg-zinc-800 px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm min-w-[100px] flex flex-col justify-center items-center gap-0.5">
              <span className="leading-tight">
                {match.final_home_score} – {match.final_away_score}
              </span>
              {match.penalty_home_score !== null && match.penalty_home_score !== undefined && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold uppercase tracking-tight block">
                  {match.penalty_home_score}–{match.penalty_away_score} str
                </span>
              )}
              {match.ot_home_score !== null && match.ot_home_score !== undefined && (match.penalty_home_score === null || match.penalty_home_score === undefined) && (
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-tight block">
                  {match.ot_home_score}–{match.ot_away_score} e.f.
                </span>
              )}
            </div>
            {hasPoints && (
              <div className={`text-sm font-black px-3 py-1 rounded-xl border ${
                prediction!.points_awarded! > 0
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40'
                  : 'bg-zinc-50 text-zinc-400 border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700 dark:text-zinc-500'
              }`}>
                {prediction!.points_awarded! > 0 ? `+${prediction!.points_awarded}p` : '0p'}
              </div>
            )}
          </>
        ) : (
          <span className="px-4 py-1.5 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 text-[10px] md:text-xs font-black rounded-full uppercase tracking-widest border border-amber-100 dark:border-amber-800/50">
            Kommande
          </span>
        )}
      </div>
    </li>
  )
}


function GroupSection({ groupName, matches, predictionMap }: {
  groupName: string
  matches: Match[]
  predictionMap: Map<string, Prediction>
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
        <h2 className="font-bold text-lg text-zinc-900 dark:text-white">{groupName}</h2>
        <span className="text-xs font-bold text-zinc-400">{matches.length} matcher</span>
      </div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {matches.map(match => (
          <MatchItem
            key={match.id}
            match={match}
            prediction={predictionMap.get(match.id)}
          />
        ))}
      </ul>
    </div>
  )
}

export function MatchTabs({ matches, predictionMap }: MatchTabsProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'played'>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter matches based on search query (home team or away team)
  const filteredMatches = matches.filter(m => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return (
      m.home_team.toLowerCase().includes(query) ||
      m.away_team.toLowerCase().includes(query)
    )
  })

  // Split matches into upcoming (including live) and played
  const upcomingMatches = filteredMatches.filter(m => {
    const isFinished = m.status === 'finished' || (m.final_home_score !== null && m.final_away_score !== null)
    return !isFinished
  })
  const playedMatches = filteredMatches.filter(m => m.status === 'finished' || (m.final_home_score !== null && m.final_away_score !== null))

  // Auto-scroll and highlight when navigating to a match hash
  useEffect(() => {
    const handleScrollAndHighlight = () => {
      if (typeof window === 'undefined') return
      
      const hash = window.location.hash
      if (!hash.startsWith('#match-')) return

      const matchId = hash.replace('#match-', '')
      const targetMatch = matches.find(m => m.id === matchId)
      if (!targetMatch) return

      // Determine correct tab and switch if necessary
      const correctTab = targetMatch.status === 'finished' ? 'played' : 'upcoming'
      if (activeTab !== correctTab) {
        setActiveTab(correctTab)
        return // Let this effect re-run on the next activeTab render cycle
      }

      // Scroll to the element after DOM finishes rendering/updating
      const scrollTimer = setTimeout(() => {
        const element = document.getElementById(`match-${matchId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          // Apply highlight styling class
          element.classList.add('highlighted-match')
          
          // Clean up the hash in the URL to allow normal tab switching
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
          }

          // Remove highlight styling after 3 seconds
          const unhighlightTimer = setTimeout(() => {
            element.classList.remove('highlighted-match')
          }, 3000)
          
          return () => clearTimeout(unhighlightTimer)
        }
      }, 150)

      return () => clearTimeout(scrollTimer)
    }

    handleScrollAndHighlight()

    window.addEventListener('hashchange', handleScrollAndHighlight)
    return () => {
      window.removeEventListener('hashchange', handleScrollAndHighlight)
    }
  }, [matches, activeTab])

  // Group helper
  const groupMatches = (matchList: Match[]) =>
    matchList.reduce((acc: Record<string, Match[]>, match) => {
      const key = match.group_name || match.stage || 'Övrigt'
      if (!acc[key]) acc[key] = []
      acc[key].push(match)
      return acc
    }, {})

  const upcomingByGroup = groupMatches(upcomingMatches)
  const playedByGroup = groupMatches(playedMatches)

  const tabs = [
    {
      key: 'upcoming' as const,
      label: 'Kommande',
      icon: <Clock className="w-4 h-4" />,
      count: upcomingMatches.length,
    },
    {
      key: 'played' as const,
      label: 'Spelade',
      icon: <CheckCircle2 className="w-4 h-4" />,
      count: playedMatches.length,
    },
  ]

  const activeGroups = activeTab === 'upcoming' ? upcomingByGroup : playedByGroup
  const isEmpty = Object.keys(activeGroups).length === 0

  return (
    <div className="space-y-6">
      {/* Sökfält */}
      <div className="w-full max-w-md flex items-center bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl border border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all shadow-sm px-4">
        <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
        <input
          type="text"
          placeholder="Sök på land (t.ex. Sverige, Belgien)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-3 pr-2 py-3 bg-transparent text-zinc-900 dark:text-white outline-none text-sm font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700/60 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all shrink-0"
            title="Rensa sökning"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
              activeTab === tab.key
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center text-zinc-400 font-bold italic flex flex-col items-center justify-center gap-2">
          {searchQuery ? (
            <>
              <span>Inga matcher hittades för &quot;{searchQuery}&quot;.</span>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
              >
                Rensa sökning
              </button>
            </>
          ) : (
            activeTab === 'upcoming' ? 'Inga kommande matcher.' : 'Inga spelade matcher ännu.'
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(activeGroups)
            .sort(([groupA], [groupB]) => compareStages(groupA, groupB))
            .map(([groupName, groupMatches]) => (
            <GroupSection
              key={groupName}
              groupName={groupName}
              matches={groupMatches}
              predictionMap={predictionMap}
            />
          ))}
        </div>
      )}
    </div>
  )
}
