'use client'

import { formatInTimeZone } from 'date-fns-tz'
import { countryToFlag } from '@/lib/utils/flags'
import { useState } from 'react'
import { Clock, CheckCircle2, Flame } from 'lucide-react'

const TIMEZONE = 'Europe/Stockholm'

interface Match {
  id: string
  home_team: string
  away_team: string
  kickoff_time: string
  status: string
  final_home_score: number | null
  final_away_score: number | null
  stage: string | null
  group_name: string | null
  venue: string | null
  broadcaster: string | null
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
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  return (
    <li className="p-4 md:p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:justify-between gap-4">
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
        {prediction && (
          <div className="mt-2 inline-flex items-center gap-2">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-800/50">
              Tips: {prediction.predicted_home_score} – {prediction.predicted_away_score}
            </div>
            {isFinished && prediction.points_awarded !== null && (
              <div className={`px-3 py-1 rounded-xl text-xs font-black border ${
                prediction.points_awarded > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                  : 'bg-zinc-50 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700'
              }`}>
                +{prediction.points_awarded}p
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center shrink-0">
        {isLive ? (
          <span className="px-4 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] md:text-xs font-black rounded-full uppercase tracking-widest animate-pulse flex items-center gap-1.5">
            <Flame className="w-3 h-3" /> Live
          </span>
        ) : isFinished ? (
          <div className="text-center font-black text-xl md:text-2xl bg-zinc-100 dark:bg-zinc-800 px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm min-w-[100px]">
            {match.final_home_score} – {match.final_away_score}
          </div>
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

  // Split matches into upcoming (including live) and played
  const upcomingMatches = matches.filter(m => m.status === 'upcoming' || m.status === 'live')
  const playedMatches = matches.filter(m => m.status === 'finished')

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
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center text-zinc-400 font-bold italic">
          {activeTab === 'upcoming' ? 'Inga kommande matcher.' : 'Inga spelade matcher ännu.'}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(activeGroups).map(([groupName, groupMatches]) => (
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
