'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Grid, 
  List, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  ArrowLeft, 
  Calendar,
  AlertCircle
} from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { KNOCKOUT_ROUNDS } from '@/lib/scoring/knockout'

const TIMEZONE = 'Europe/Stockholm'

interface Profile {
  display_name: string | null
  email: string | null
}

interface Member {
  user_id: string
  role: string
  profiles: Profile | null
}

interface Match {
  id: string
  home_team: string
  away_team: string
  kickoff_time: string
  stage: string | null
  group_name: string | null
  status: string
}

interface Prediction {
  user_id: string
  match_id: string
  predicted_home_score: number
  predicted_away_score: number
}

interface KnockoutPrediction {
  user_id: string
  round: string
  team_name: string
}

interface PredictionsOverviewClientProps {
  groupId: string
  gameId: string
  gameName: string
  members: Member[]
  matches: Match[]
  predictions: Prediction[]
  knockoutPredictions: KnockoutPrediction[]
}

const CATEGORIES = [
  'Gruppspel',
  'Round of 32',
  'Round of 16',
  'Kvartsfinal',
  'Semifinal',
  'Match for third place',
  'Final'
]

function getStageCategory(match: Match): string {
  const stage = (match.stage || '').toLowerCase().trim()
  const group = (match.group_name || '').toLowerCase().trim()
  
  if (group !== '' || stage === 'gruppspel' || stage === 'group stage' || stage.startsWith('matchday')) {
    return 'Gruppspel'
  }
  if (stage === 'round of 32' || stage === 'sextondelsfinal') {
    return 'Round of 32'
  }
  if (stage === 'round of 16' || stage === 'åttondelsfinal') {
    return 'Round of 16'
  }
  if (stage === 'quarter-final' || stage === 'kvartsfinal') {
    return 'Kvartsfinal'
  }
  if (stage === 'semi-final' || stage === 'semifinal') {
    return 'Semifinal'
  }
  if (stage === 'match for third place' || stage === 'bronsmatch' || stage === 'match om tredjepris') {
    return 'Match for third place'
  }
  if (stage === 'final') {
    return 'Final'
  }
  return 'Övrigt'
}

export function PredictionsOverviewClient({
  groupId,
  gameId,
  gameName,
  members,
  matches,
  predictions,
  knockoutPredictions
}: PredictionsOverviewClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all')
  const [viewMode, setViewMode] = useState<'matrix' | 'detailed'>('matrix')
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({})
  const [copiedMemberId, setCopiedMemberId] = useState<string | null>(null)

  // 1. Group matches into categories
  const matchesByCategory: Record<string, Match[]> = {}
  matches.forEach(match => {
    const cat = getStageCategory(match)
    if (!matchesByCategory[cat]) {
      matchesByCategory[cat] = []
    }
    matchesByCategory[cat].push(match)
  })

  // Only include categories that actually have matches
  const activeCategories = CATEGORIES.filter(cat => 
    matchesByCategory[cat] && matchesByCategory[cat].length > 0
  )
  if (matchesByCategory['Övrigt'] && matchesByCategory['Övrigt'].length > 0) {
    activeCategories.push('Övrigt')
  }

  // 2. Map predictions to a lookup set
  const predictionSet = new Set(
    predictions.map(p => `${p.user_id}_${p.match_id}`)
  )

  // Group knockout predictions by user and round
  const knockoutByUserAndRound: Record<string, Record<string, string[]>> = {}
  knockoutPredictions.forEach(kp => {
    if (!knockoutByUserAndRound[kp.user_id]) {
      knockoutByUserAndRound[kp.user_id] = {}
    }
    if (!knockoutByUserAndRound[kp.user_id][kp.round]) {
      knockoutByUserAndRound[kp.user_id][kp.round] = []
    }
    knockoutByUserAndRound[kp.user_id][kp.round].push(kp.team_name)
  })

  // 3. Process each member's completion status
  const memberStats = members.map(m => {
    const displayName = m.profiles?.display_name || m.profiles?.email || 'Okänd spelare'
    const email = m.profiles?.email || ''
    
    // Match predictions stats
    const stageStats: Record<string, { total: number; predicted: number; missing: Match[] }> = {}
    let totalPredicted = 0
    let totalMatchesCount = 0

    activeCategories.forEach(cat => {
      const catMatches = matchesByCategory[cat] || []
      const missing: Match[] = []
      let predictedCount = 0

      catMatches.forEach(match => {
        const hasPred = predictionSet.has(`${m.user_id}_${match.id}`)
        if (hasPred) {
          predictedCount++
        } else {
          missing.push(match)
        }
      })

      stageStats[cat] = {
        total: catMatches.length,
        predicted: predictedCount,
        missing
      }

      totalPredicted += predictedCount
      totalMatchesCount += catMatches.length
    })

    // Knockout predictions stats
    const koStats: Record<string, { total: number; predicted: number; missingCount: number; picks: string[] }> = {}
    let totalKoPredicted = 0
    let totalKoRequired = 0

    KNOCKOUT_ROUNDS.forEach(r => {
      const picks = knockoutByUserAndRound[m.user_id]?.[r.key] || []
      const predictedCount = picks.length
      const requiredCount = r.teamCount

      koStats[r.key] = {
        total: requiredCount,
        predicted: predictedCount,
        missingCount: Math.max(0, requiredCount - predictedCount),
        picks
      }

      totalKoPredicted += Math.min(predictedCount, requiredCount)
      totalKoRequired += requiredCount
    })

    const isMatchesCompleted = totalMatchesCount > 0 && totalPredicted === totalMatchesCount
    const isKoCompleted = totalKoPredicted === totalKoRequired
    const isFullyCompleted = isMatchesCompleted && isKoCompleted

    return {
      user_id: m.user_id,
      displayName,
      email,
      role: m.role,
      stageStats,
      koStats,
      totalPredicted,
      totalMatchesCount,
      totalKoPredicted,
      totalKoRequired,
      isFullyCompleted,
      isMatchesCompleted,
      isKoCompleted
    }
  })

  // 4. Calculate summaries
  const totalCount = memberStats.length
  const completedCount = memberStats.filter(m => m.isFullyCompleted).length
  const incompleteCount = totalCount - completedCount

  // 5. Filter and Search members
  const filteredMembers = memberStats.filter(m => {
    const matchesSearch = m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false

    if (statusFilter === 'completed') return m.isFullyCompleted
    if (statusFilter === 'incomplete') return !m.isFullyCompleted
    return true
  })

  const toggleExpand = (userId: string) => {
    setExpandedMembers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  const copyReminderText = (m: typeof memberStats[0]) => {
    const missingMatchesDetails: string[] = []
    activeCategories.forEach(cat => {
      const { missing } = m.stageStats[cat]
      missing.forEach(match => {
        const formattedTime = formatInTimeZone(new Date(match.kickoff_time), TIMEZONE, 'd MMM HH:mm')
        missingMatchesDetails.push(`- ${match.home_team} vs ${match.away_team} (${formattedTime} - ${cat})`)
      })
    })

    const missingKoDetails: string[] = []
    KNOCKOUT_ROUNDS.forEach(r => {
      const stats = m.koStats[r.key]
      if (stats.missingCount > 0) {
        missingKoDetails.push(`- ${r.label}: Saknar ${stats.missingCount} lag (valt ${stats.predicted}/${stats.total})`)
      }
    })

    let reminder = `Hej ${m.displayName}! 🏆\nKom ihåg att lägga dina tips i spelet "${gameName}" på Skorio!\n`
    
    if (missingMatchesDetails.length > 0) {
      reminder += `\nDu saknar matchtips för följande matcher:\n${missingMatchesDetails.join('\n')}\n`
    }
    if (missingKoDetails.length > 0) {
      reminder += `\nDu saknar val av lag i slutspelstipset:\n${missingKoDetails.join('\n')}\n`
    }

    reminder += `\nIn och tippa innan deadlines! ⚽️`

    navigator.clipboard.writeText(reminder)
    setCopiedMemberId(m.user_id)
    setTimeout(() => {
      setCopiedMemberId(null)
    }, 2050)
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 pb-32">
      {/* Back to Admin */}
      <Link 
        href={`/dashboard/groups/${groupId}/games/${gameId}/admin`} 
        className="inline-flex items-center text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition gap-2 mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Tillbaka till Admin
      </Link>

      {/* Header Title */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
          Tippningsöversikt
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg">
          Följ upp vilka spelare i gruppen som har tippat matcherna samt valt slutspelslag inför spelstart.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Medlemmar</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-white">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Helt klara</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {completedCount} <span className="text-sm font-bold text-zinc-400">({totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%)</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Saknar tips</p>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{incompleteCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-sm mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Sök medlem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 text-zinc-900 dark:text-white transition-colors"
          />
        </div>

        {/* Filter & View Mode */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-2xl">
            {(['all', 'completed', 'incomplete'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  statusFilter === f
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {f === 'all' ? 'Alla' : f === 'completed' ? 'Klara' : 'Saknar tips'}
              </button>
            ))}
          </div>

          {/* View Switcher */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('matrix')}
              className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
              title="Översiktstabell"
            >
              <Grid className="w-4 h-4" />
              <span>Matris</span>
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition ${
                viewMode === 'detailed'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
              title="Detaljerad vy med påminnelser"
            >
              <List className="w-4 h-4" />
              <span>Detaljer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center text-zinc-400 font-bold italic">
          Inga medlemmar matchar filtreringen.
        </div>
      ) : viewMode === 'matrix' ? (
        /* MATRIX VIEW */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[1200px]">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th rowSpan={2} className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 align-middle">Spelare</th>
                <th colSpan={activeCategories.length} className="p-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-300 text-center border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/10">
                  Matchtips (Resultat)
                </th>
                <th colSpan={KNOCKOUT_ROUNDS.length} className="p-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-300 text-center bg-zinc-50/50 dark:bg-zinc-900/10">
                  Slutspelstips (Kvalificerade lag)
                </th>
                <th rowSpan={2} className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center w-28 align-middle">Status</th>
              </tr>
              <tr className="bg-zinc-50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800">
                {activeCategories.map((cat, i) => (
                  <th key={cat} className={`p-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center ${i === activeCategories.length - 1 ? 'border-r border-zinc-200 dark:border-zinc-700' : ''}`}>
                    {cat}
                  </th>
                ))}
                {KNOCKOUT_ROUNDS.map(r => (
                  <th key={r.key} className="p-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-center">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredMembers.map(m => (
                <tr key={m.user_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                  {/* Spelare */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm">
                        {m.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">{m.displayName}</p>
                      </div>
                    </div>
                  </td>

                  {/* Match categories */}
                  {activeCategories.map((cat, i) => {
                    const stats = m.stageStats[cat] || { total: 0, predicted: 0 }
                    const isAll = stats.predicted === stats.total
                    const isNone = stats.predicted === 0

                    if (stats.total === 0) {
                      return (
                        <td key={cat} className={`p-3 text-center ${i === activeCategories.length - 1 ? 'border-r border-zinc-200 dark:border-zinc-700' : ''}`}>
                          <span className="text-xs text-zinc-300 dark:text-zinc-700 font-bold">-</span>
                        </td>
                      )
                    }

                    return (
                      <td key={cat} className={`p-3 text-center ${i === activeCategories.length - 1 ? 'border-r border-zinc-200 dark:border-zinc-700' : ''}`}>
                        {isAll ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full leading-none">
                            {stats.predicted}/{stats.total}
                          </span>
                        ) : isNone ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-black rounded-full leading-none">
                            0/{stats.total}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-full leading-none">
                            {stats.predicted}/{stats.total}
                          </span>
                        )}
                      </td>
                    )
                  })}

                  {/* Knockout categories */}
                  {KNOCKOUT_ROUNDS.map(r => {
                    const stats = m.koStats[r.key] || { total: 0, predicted: 0 }
                    const isAll = stats.predicted === stats.total
                    const isNone = stats.predicted === 0

                    return (
                      <td key={r.key} className="p-3 text-center">
                        {isAll ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full leading-none">
                            {stats.predicted}/{stats.total}
                          </span>
                        ) : isNone ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-black rounded-full leading-none">
                            0/{stats.total}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-full leading-none">
                            {stats.predicted}/{stats.total}
                          </span>
                        )}
                      </td>
                    )
                  })}

                  {/* Total Status */}
                  <td className="p-4 text-center">
                    {m.isFullyCompleted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm shadow-emerald-500/20">
                        <Check className="w-3 h-3" />
                        Klar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm shadow-amber-500/20">
                        Saknas
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* DETAILED VIEW (WITH REMINDERS) */
        <div className="space-y-4">
          {filteredMembers.map(m => {
            const isExpanded = !!expandedMembers[m.user_id]
            const isCopied = copiedMemberId === m.user_id

            // Calculate total missing match count
            let totalMissingCount = 0
            activeCategories.forEach(cat => {
              totalMissingCount += m.stageStats[cat]?.missing?.length || 0
            })

            // Calculate total missing knockout team picks count
            let totalMissingKoCount = 0
            KNOCKOUT_ROUNDS.forEach(r => {
              totalMissingKoCount += m.koStats[r.key]?.missingCount || 0
            })

            return (
              <div 
                key={m.user_id} 
                className={`bg-white dark:bg-zinc-900 border rounded-3xl shadow-sm transition-all overflow-hidden ${
                  m.isFullyCompleted 
                    ? 'border-zinc-200 dark:border-zinc-800' 
                    : 'border-amber-200 dark:border-amber-900/40 hover:border-amber-300'
                }`}
              >
                {/* Accordion Header */}
                <div 
                  onClick={() => toggleExpand(m.user_id)}
                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm">
                      {m.displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-base text-zinc-900 dark:text-white leading-tight">
                          {m.displayName}
                        </h3>
                        {m.isFullyCompleted ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                            <Check className="w-2.5 h-2.5" /> Klar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                            Saknar {totalMissingCount + totalMissingKoCount} tips
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Progress Bar (Overall percentage) */}
                    <div className="flex items-center gap-3 flex-1 sm:flex-initial min-w-[150px]">
                      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full flex-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            m.isFullyCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ 
                            width: `${(m.totalMatchesCount + m.totalKoRequired) > 0 
                              ? ((m.totalPredicted + m.totalKoPredicted) / (m.totalMatchesCount + m.totalKoRequired)) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs font-black text-zinc-500 shrink-0">
                        {m.totalPredicted + m.totalKoPredicted}/{m.totalMatchesCount + m.totalKoRequired}
                      </span>
                    </div>

                    {/* Expand Arrow */}
                    <button className="text-zinc-400 hover:text-zinc-600 p-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="px-5 pb-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <div className="pt-6 space-y-6">
                      {/* Remind Button */}
                      {!m.isFullyCompleted && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300">Medlemmen saknar tippningar</h4>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Kopiera en påminnelsetext med de saknade matcherna och slutspelsvalen för att skicka till spelaren.</p>
                            </div>
                          </div>
                          <button
                            onClick={() => copyReminderText(m)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap shadow-sm ${
                              isCopied 
                                ? 'bg-emerald-600 text-white shadow-emerald-600/10'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/10'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Kopierad!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Kopiera påminnelse
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Split stage grids (Match vs Knockout) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Matchtips Section */}
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                            <span>⚽️ Matchtips (Resultat)</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 rounded-full">
                              {m.totalPredicted}/{m.totalMatchesCount} tippade
                            </span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {activeCategories.map(cat => {
                              const { total, predicted, missing } = m.stageStats[cat] || { total: 0, predicted: 0, missing: [] }
                              const isDone = predicted === total

                              if (total === 0) return null

                              return (
                                <div key={cat} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                                  <div className="flex items-center justify-between mb-3 gap-2">
                                    <span className="font-bold text-sm text-zinc-950 dark:text-white truncate">{cat}</span>
                                    {isDone ? (
                                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider flex items-center gap-0.5 shrink-0 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                                        Klar
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-0.5 shrink-0 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/30">
                                        {total - predicted} kvar
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-xl font-black text-zinc-900 dark:text-white">
                                        {predicted}/{total}
                                      </span>
                                      <span className="text-xs font-bold text-zinc-400">tippade</span>
                                    </div>

                                    {missing.length > 0 && (
                                      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Saknade matcher:</p>
                                        <ul className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                                          {missing.map(match => (
                                            <li key={match.id} className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-100/50 dark:border-zinc-800/40">
                                              <div className="font-bold truncate leading-tight mb-0.5">
                                                {match.home_team} vs {match.away_team}
                                              </div>
                                              <div className="text-[9px] text-zinc-400 font-medium flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-zinc-300" />
                                                {formatInTimeZone(new Date(match.kickoff_time), TIMEZONE, 'd MMM HH:mm')}
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Slutspelstips Section */}
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                            <span>🏆 Slutspelstips (Kvalificerade lag)</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 rounded-full">
                              {m.totalKoPredicted}/{m.totalKoRequired} valda
                            </span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {KNOCKOUT_ROUNDS.map(r => {
                              const stats = m.koStats[r.key] || { total: 0, predicted: 0, missingCount: 0, picks: [] }
                              const isDone = stats.predicted === stats.total

                              return (
                                <div key={r.key} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                                  <div className="flex items-center justify-between mb-3 gap-2">
                                    <span className="font-bold text-sm text-zinc-950 dark:text-white truncate">{r.label}</span>
                                    {isDone ? (
                                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider flex items-center gap-0.5 shrink-0 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                                        Klar
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-0.5 shrink-0 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/30">
                                        {stats.missingCount} kvar
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-xl font-black text-zinc-900 dark:text-white">
                                        {stats.predicted}/{stats.total}
                                      </span>
                                      <span className="text-xs font-bold text-zinc-400">lag valda</span>
                                    </div>

                                    {stats.picks.length > 0 && (
                                      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Valda lag:</p>
                                        <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto pr-1">
                                          {stats.picks.map(pick => (
                                            <span key={pick} className="text-[10px] font-bold bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800/80 px-2 py-0.5 rounded-lg">
                                              {pick}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
