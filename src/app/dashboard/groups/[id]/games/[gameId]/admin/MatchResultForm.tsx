'use client'

import { useState, useEffect } from 'react'

interface MatchResultFormProps {
  matchId: string
  homeScore: number | null
  awayScore: number | null
  status: string
  homeTeam: string
  awayTeam: string
  stage: string | null
  teams?: string[]
  redCards?: number | null
  ownGoals?: number | null
  matchGoals?: any[]
}

export function MatchResultForm({ 
  matchId, 
  homeScore, 
  awayScore, 
  status,
  homeTeam,
  awayTeam,
  stage,
  teams = [],
  redCards = 0,
  ownGoals = 0,
  matchGoals = []
}: MatchResultFormProps) {
  const isKnockout = stage && (
    stage.toLowerCase().includes('round') || 
    stage.toLowerCase().includes('final') || 
    stage.toLowerCase().includes('quarter') || 
    stage.toLowerCase().includes('semi') ||
    stage.toLowerCase().includes('third place') ||
    stage.toLowerCase().includes('play-off')
  );

  const [showGoals, setShowGoals] = useState(false)
  const [goals, setGoals] = useState<any[]>([])

  useEffect(() => {
    if (matchGoals) {
      setGoals(matchGoals)
    }
  }, [matchGoals])

  const addGoal = () => {
    setGoals([...goals, {
      player_name: '',
      team_name: homeTeam,
      minute: null,
      is_penalty: false,
      is_own_goal: false
    }])
  }

  const removeGoal = (idx: number) => {
    setGoals(goals.filter((_, i) => i !== idx))
  }

  const updateGoal = (idx: number, field: string, value: any) => {
    setGoals(goals.map((g, i) => {
      if (i !== idx) return g
      const updated = { ...g, [field]: value }
      
      // Smart auto-invertering av lag om självmål markeras
      if (field === 'is_own_goal') {
        if (value) {
          updated.team_name = g.team_name === homeTeam ? awayTeam : homeTeam
        } else {
          updated.team_name = g.team_name === awayTeam ? homeTeam : awayTeam
        }
      }
      return updated
    }))
  }

  return (
    <>
      <td className="p-4">
        {isKnockout ? (
          <div className="flex flex-col gap-2 min-w-[200px]">
            <select 
              form="bulk-matches-form"
              name={`${matchId}_homeTeam`} 
              defaultValue={homeTeam} 
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            >
              <option value="">Välj hemmalag...</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
              {!teams.includes(homeTeam) && homeTeam && (
                <option value={homeTeam}>{homeTeam}</option>
              )}
            </select>
            <select 
              form="bulk-matches-form"
              name={`${matchId}_awayTeam`} 
              defaultValue={awayTeam} 
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            >
              <option value="">Välj bortalag...</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
              {!teams.includes(awayTeam) && awayTeam && (
                <option value={awayTeam}>{awayTeam}</option>
              )}
            </select>
          </div>
        ) : (
          <div className="font-bold text-zinc-900 dark:text-zinc-100">{homeTeam} - {awayTeam}</div>
        )}
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-2">
          {/* Mål */}
          <div className="flex gap-2 items-center">
            <input 
              form="bulk-matches-form"
              type="number" 
              name={`${matchId}_homeScore`} 
              defaultValue={homeScore ?? ''} 
              className="w-12 h-10 text-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-indigo-600 dark:text-indigo-400"
            />
            <span className="text-zinc-400">-</span>
            <input 
              form="bulk-matches-form"
              type="number" 
              name={`${matchId}_awayScore`} 
              defaultValue={awayScore ?? ''} 
              className="w-12 h-10 text-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-indigo-600 dark:text-indigo-400"
            />
          </div>
          
          {/* Röda kort & Självmål */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1" title="Antal röda kort">
              <span className="text-xs select-none">🟥</span>
              <input 
                form="bulk-matches-form"
                type="number" 
                name={`${matchId}_redCards`} 
                defaultValue={redCards ?? 0}
                min={0}
                className="w-9 h-7 text-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-zinc-700 dark:text-zinc-300 text-xs"
              />
            </div>
            <div className="flex items-center gap-1" title="Antal självmål">
              <span className="text-xs select-none">⚽</span>
              <input 
                form="bulk-matches-form"
                type="number" 
                name={`${matchId}_ownGoals`} 
                defaultValue={ownGoals ?? 0}
                min={0}
                className="w-9 h-7 text-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-zinc-700 dark:text-zinc-300 text-xs"
              />
            </div>
          </div>

          {/* Målskyttar toggle */}
          <button
            type="button"
            onClick={() => setShowGoals(!showGoals)}
            className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition flex items-center gap-1 mt-1.5 w-fit"
          >
            <span>⚽</span> Målskyttar ({goals.length})
          </button>

          {/* Målskyttar editor */}
          {showGoals && (
            <div className="flex flex-col gap-2 mt-2 p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-250 dark:border-zinc-800/80 min-w-[260px] max-w-[320px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-550">Målskyttar</span>
              
              {goals.map((goal, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 p-2 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl relative">
                  <div className="flex items-center gap-2">
                    <input
                      form="bulk-matches-form"
                      type="text"
                      name={`${matchId}_goal_player_${idx}`}
                      value={goal.player_name}
                      onChange={(e) => updateGoal(idx, 'player_name', e.target.value)}
                      placeholder="Spelarnamn..."
                      required
                      className="w-full px-2 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => removeGoal(idx)}
                      className="text-zinc-400 hover:text-red-500 transition text-sm font-bold shrink-0 px-1"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between gap-1">
                    <select
                      form="bulk-matches-form"
                      name={`${matchId}_goal_team_${idx}`}
                      value={goal.team_name}
                      onChange={(e) => updateGoal(idx, 'team_name', e.target.value)}
                      className="w-[110px] px-1 py-0.5 text-[10px] rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-bold outline-none"
                    >
                      <option value={homeTeam}>{homeTeam}</option>
                      <option value={awayTeam}>{awayTeam}</option>
                    </select>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <input
                        form="bulk-matches-form"
                        type="number"
                        name={`${matchId}_goal_minute_${idx}`}
                        value={goal.minute ?? ''}
                        onChange={(e) => updateGoal(idx, 'minute', e.target.value ? parseInt(e.target.value, 10) : null)}
                        placeholder="Min"
                        className="w-9 px-1 py-0.5 text-[10px] text-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-semibold"
                      />
                      <span className="text-[9px] text-zinc-400">'</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <label className="flex items-center gap-0.5 text-[9px] font-black text-zinc-400 cursor-pointer" title="Straff">
                        <input
                          form="bulk-matches-form"
                          type="checkbox"
                          name={`${matchId}_goal_penalty_${idx}`}
                          checked={goal.is_penalty}
                          onChange={(e) => updateGoal(idx, 'is_penalty', e.target.checked)}
                          className="w-2.5 h-2.5 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500 dark:bg-zinc-950"
                        />
                        <span>P</span>
                      </label>
                      <label className="flex items-center gap-0.5 text-[9px] font-black text-zinc-400 cursor-pointer" title="Självmål">
                        <input
                          form="bulk-matches-form"
                          type="checkbox"
                          name={`${matchId}_goal_owngoal_${idx}`}
                          checked={goal.is_own_goal}
                          onChange={(e) => updateGoal(idx, 'is_own_goal', e.target.checked)}
                          className="w-2.5 h-2.5 text-red-600 border-zinc-300 rounded focus:ring-red-500 dark:bg-zinc-950"
                        />
                        <span>S</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addGoal}
                className="w-full mt-0.5 px-3 py-1.5 border border-dashed border-zinc-250 dark:border-zinc-800 text-zinc-500 hover:text-indigo-600 hover:border-indigo-500 transition rounded-xl text-[10px] font-bold flex items-center justify-center gap-1"
              >
                + Lägg till mål
              </button>
            </div>
          )}
        </div>
      </td>
      <td className="p-4">
        <select 
          form="bulk-matches-form"
          name={`${matchId}_status`} 
          defaultValue={status} 
          className="text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-black uppercase tracking-tight transition-all"
        >
          <option value="upcoming">Kommande</option>
          <option value="live">Live</option>
          <option value="finished">Avslutad</option>
        </select>
      </td>
    </>
  )
}
