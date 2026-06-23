'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { fetchSvtBroadcasters } from '@/lib/utils/svtScraper'
import { calculatePoints, DEFAULT_RULES } from '@/lib/scoring/engine'

export async function bulkUpdateMatchResults(
  groupId: string,
  gameId: string,
  formData: FormData
) {
  const supabase = await createClient()
  
  // Hitta alla match-ids i formdatan
  const matchIds = new Set<string>()
  for (const key of Array.from(formData.keys())) {
    const matchId = key.split('_')[0]
    if (matchId && matchId.length > 20) { // Enkel koll för UUID-liknande strängar
      matchIds.add(matchId)
    }
  }

  try {
    // Hämta befintliga matcher för att jämföra värden samt deras målskyttar
    const { data: dbMatches } = await supabase
      .from('matches')
      .select('id, final_home_score, final_away_score, status, home_team, away_team, is_manual_override, red_cards, own_goals, match_goals(id, player_name, team_name, minute, is_penalty, is_own_goal)')
      .in('id', Array.from(matchIds))

    if (!dbMatches) return { success: false, error: 'Kunde inte hämta matcher för validering.' }

    for (const matchId of Array.from(matchIds)) {
      const existing = dbMatches.find(m => m.id === matchId)
      if (!existing) continue

      const homeScoreStr = formData.get(`${matchId}_homeScore`) as string
      const awayScoreStr = formData.get(`${matchId}_awayScore`) as string
      const status = formData.get(`${matchId}_status`) as string
      const homeTeam = formData.get(`${matchId}_homeTeam`) as string
      const awayTeam = formData.get(`${matchId}_awayTeam`) as string
      const redCardsStr = formData.get(`${matchId}_redCards`) as string
      const ownGoalsStr = formData.get(`${matchId}_ownGoals`) as string

      if (homeScoreStr === null || awayScoreStr === null) continue

      const homeScore = parseInt(homeScoreStr, 10)
      const awayScore = parseInt(awayScoreStr, 10)
      const redCards = parseInt(redCardsStr, 10)
      const ownGoals = parseInt(ownGoalsStr, 10)
      
      const newHomeScore = isNaN(homeScore) ? null : homeScore
      const newAwayScore = isNaN(awayScore) ? null : awayScore
      const newRedCards = isNaN(redCards) ? 0 : redCards
      const newOwnGoals = isNaN(ownGoals) ? 0 : ownGoals

      // Hämta manuella målskyttar för matchen från formdatan
      const matchGoals: any[] = []
      let idx = 0
      while (true) {
        const nameKey = `${matchId}_goal_player_${idx}`
        if (!formData.has(nameKey)) break
        
        const playerName = formData.get(nameKey) as string
        if (playerName && playerName.trim()) {
          const teamName = formData.get(`${matchId}_goal_team_${idx}`) as string
          const minuteStr = formData.get(`${matchId}_goal_minute_${idx}`) as string
          const isPenalty = formData.get(`${matchId}_goal_penalty_${idx}`) === 'on' || formData.get(`${matchId}_goal_penalty_${idx}`) === 'true'
          const isOwnGoal = formData.get(`${matchId}_goal_owngoal_${idx}`) === 'on' || formData.get(`${matchId}_goal_owngoal_${idx}`) === 'true'
          const minute = parseInt(minuteStr, 10)
          
          matchGoals.push({
            match_id: matchId,
            player_name: playerName.trim(),
            team_name: teamName || (isOwnGoal ? (awayTeam || existing.away_team) : (homeTeam || existing.home_team)),
            minute: isNaN(minute) ? null : minute,
            is_penalty: isPenalty,
            is_own_goal: isOwnGoal
          })
        }
        idx++
      }

      // Jämför målskyttar
      const existingGoals = (existing as any).match_goals || []
      const goalsChanged = existingGoals.length !== matchGoals.length || 
        matchGoals.some((g, i) => {
          const eg = existingGoals[i]
          if (!eg) return true
          return g.player_name !== eg.player_name ||
                 g.team_name !== eg.team_name ||
                 g.minute !== eg.minute ||
                 g.is_penalty !== eg.is_penalty ||
                 g.is_own_goal !== eg.is_own_goal
        })

      // Kolla om något faktiskt har ändrats
      const hasChanged = 
        newHomeScore !== existing.final_home_score ||
        newAwayScore !== existing.final_away_score ||
        status !== existing.status ||
        newRedCards !== (existing.red_cards ?? 0) ||
        newOwnGoals !== (existing.own_goals ?? 0) ||
        goalsChanged ||
        (homeTeam && homeTeam !== existing.home_team) ||
        (awayTeam && awayTeam !== existing.away_team)

      if (!hasChanged) continue

      const updateData: any = {
        final_home_score: newHomeScore,
        final_away_score: newAwayScore,
        status: status,
        red_cards: newRedCards,
        own_goals: newOwnGoals,
        is_manual_override: true
      }

      if (homeTeam) updateData.home_team = homeTeam
      if (awayTeam) updateData.away_team = awayTeam

      await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId)

      // Uppdatera målskyttar: ta bort gamla och stoppa in nya
      await supabase
        .from('match_goals')
        .delete()
        .eq('match_id', matchId)
        
      if (matchGoals.length > 0) {
        await supabase
          .from('match_goals')
          .insert(matchGoals)
      }
    }
    
    // Automatisk omräkning av poäng efter bulk-uppdatering
    await calculateScores(groupId, gameId)
  } catch (err: any) {
    return { success: false, error: 'Kunde inte spara: ' + err.message }
  }

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin`)
  return { success: true, message: 'Alla matchresultat har sparats!' }
}

export async function updateMatchResult(
  groupId: string,
  gameId: string,
  matchId: string,
  formData: FormData
) {
  const supabase = await createClient()
  
  const homeScore = parseInt(formData.get('homeScore') as string, 10)
  const awayScore = parseInt(formData.get('awayScore') as string, 10)
  const status = formData.get('status') as string
  const homeTeam = formData.get('homeTeam') as string
  const awayTeam = formData.get('awayTeam') as string
  const redCards = parseInt(formData.get('redCards') as string, 10)
  const ownGoals = parseInt(formData.get('ownGoals') as string, 10)

  const updateData: any = {
    final_home_score: isNaN(homeScore) ? null : homeScore,
    final_away_score: isNaN(awayScore) ? null : awayScore,
    status: status,
    red_cards: isNaN(redCards) ? 0 : redCards,
    own_goals: isNaN(ownGoals) ? 0 : ownGoals,
    is_manual_override: true
  }

  if (homeTeam) updateData.home_team = homeTeam
  if (awayTeam) updateData.away_team = awayTeam

  await supabase
    .from('matches')
    .update(updateData)
    .eq('id', matchId)

  // Hämta manuella målskyttar för matchen från formdatan
  const matchGoals: any[] = []
  let idx = 0
  while (true) {
    const nameKey = `goal_player_${idx}`
    const hasKey = formData.has(nameKey) || formData.has(`${matchId}_goal_player_${idx}`)
    const keyToUse = formData.has(nameKey) ? nameKey : `${matchId}_goal_player_${idx}`
    if (!hasKey) break
    
    const playerName = formData.get(keyToUse) as string
    if (playerName && playerName.trim()) {
      const teamPrefix = keyToUse.replace('_player_', '_team_')
      const minutePrefix = keyToUse.replace('_player_', '_minute_')
      const penaltyPrefix = keyToUse.replace('_player_', '_penalty_')
      const owngoalPrefix = keyToUse.replace('_player_', '_owngoal_')
      
      const teamName = formData.get(teamPrefix) as string
      const minuteStr = formData.get(minutePrefix) as string
      const isPenalty = formData.get(penaltyPrefix) === 'on' || formData.get(penaltyPrefix) === 'true'
      const isOwnGoal = formData.get(owngoalPrefix) === 'on' || formData.get(owngoalPrefix) === 'true'
      const minute = parseInt(minuteStr, 10)
      
      matchGoals.push({
        match_id: matchId,
        player_name: playerName.trim(),
        team_name: teamName || (isOwnGoal ? (awayTeam || '') : (homeTeam || '')),
        minute: isNaN(minute) ? null : minute,
        is_penalty: isPenalty,
        is_own_goal: isOwnGoal
      })
    }
    idx++
  }

  await supabase
    .from('match_goals')
    .delete()
    .eq('match_id', matchId)

  if (matchGoals.length > 0) {
    await supabase
      .from('match_goals')
      .insert(matchGoals)
  }

  // Automatisk omräkning av poäng efter individuell uppdatering
  await calculateScores(groupId, gameId)

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin`)
  return { success: true, message: 'Resultatet har uppdaterats.' }
}

export async function updateGameName(groupId: string, gameId: string, prevState: any, formData: FormData) {
  const supabase = await createClient()
  const newName = formData.get('name') as string

  if (!newName || newName.trim().length === 0) {
    return { success: false, error: 'Namnet får inte vara tomt.' }
  }

  const { error } = await supabase
    .from('games')
    .update({ name: newName.trim() })
    .eq('id', gameId)
    .eq('group_id', groupId)

  if (error) {
    return { success: false, error: 'Kunde inte uppdatera namnet: ' + error.message }
  }

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin`)
  revalidatePath(`/dashboard/groups/${groupId}`)
  return { success: true, message: 'Turneringens namn har uppdaterats.' }
}


import { KNOCKOUT_ROUNDS, KNOCKOUT_ROUND_POINTS } from '@/lib/scoring/knockout'
import { prepareLeaderboardSnapshot } from '@/lib/scoring/leaderboard'

export async function calculateScores(groupId: string, gameId: string, _formData?: FormData) {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('matches')
    .select('id, final_home_score, final_away_score, status, home_team, away_team, stage')
    .eq('game_id', gameId)

  if (!matches || matches.length === 0) {
    console.error('Inga matcher hittades.')
    return
  }

  const matchIds = matches.map(m => m.id)
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .in('match_id', matchIds)

  if (!predictions) {
    console.error('Inga tips hittades.')
    return
  }

  // Verify that the current user is an admin of the group
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    console.error('Ej behörig att beräkna poäng.')
    return
  }

  // Prepare leaderboard snapshot before updating points to detect changes
  const commitSnapshot = await prepareLeaderboardSnapshot(groupId)

  // 1. Calculate Match Results Points
  for (const match of matches) {
    const matchPredictions = predictions.filter(p => p.match_id === match.id)
    const isFinished = match.status === 'finished'
    
    for (const pred of matchPredictions) {
      let points = null;

      if (isFinished && match.final_home_score !== null && match.final_away_score !== null) {
        points = calculatePoints(
          { 
            predicted_home_score: pred.predicted_home_score, 
            predicted_away_score: pred.predicted_away_score,
            predicted_home_team: pred.predicted_home_team,
            predicted_away_team: pred.predicted_away_team
          },
          { 
            final_home_score: match.final_home_score, 
            final_away_score: match.final_away_score,
            home_team: match.home_team,
            away_team: match.away_team
          },
          DEFAULT_RULES
        )
      }

      if (pred.points_awarded !== points) {
        await supabase
          .from('predictions')
          .update({ 
            points_awarded: points,
            updated_at: new Date().toISOString()
          })
          .eq('id', pred.id)
      }
    }
  }

  // 2. Calculate Knockout Stage Points (Robust Automation)
  await recalculateAllKnockoutScores(gameId, matches, supabase)

  // Commit snapshot if changes occurred
  await commitSnapshot()

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/leaderboard`)
  return { success: true, message: 'Alla poäng (matcher & slutspel) har räknats om!' }
}

async function recalculateAllKnockoutScores(gameId: string, matches: any[], supabase: any) {
  // Map DB stage names to our internal keys
  const stageMap: Record<string, string> = {
    'Round of 16': 'round_of_16',
    'Quarter-final': 'quarter_final',
    'Semi-final': 'semi_final',
    'Match for third place': 'third_place',
    'Final': 'final'
  }

  const isPlaceholder = (name: string) => {
    if (!name) return true
    const n = name.toLowerCase()
    return n.includes('winner') || n.includes('loser') || n.includes('tbd') || /^w\d+$/.test(n) || /^l\d+$/.test(n) || n.includes('match')
  }

  // Fetch manual overrides
  const { data: manualTeams } = await supabase
    .from('knockout_actual_teams')
    .select('round, team_name')
    .eq('game_id', gameId)

  // Derive actual teams per round from the matches table
  const actualTeamsByRound = new Map<string, Set<string>>()
  
  // 1. Add manual overrides
  for (const at of manualTeams ?? []) {
    if (!actualTeamsByRound.has(at.round)) actualTeamsByRound.set(at.round, new Set())
    actualTeamsByRound.get(at.round)!.add(at.team_name.toLowerCase().trim())
  }

  // 2. Add automated teams from matches
  for (const m of matches) {
    const internalKey = stageMap[m.stage]
    if (!internalKey) continue

    if (!actualTeamsByRound.has(internalKey)) {
      actualTeamsByRound.set(internalKey, new Set())
    }

    if (m.home_team && !isPlaceholder(m.home_team)) {
      actualTeamsByRound.get(internalKey)!.add(m.home_team.toLowerCase().trim())
    }
    if (m.away_team && !isPlaceholder(m.away_team)) {
      actualTeamsByRound.get(internalKey)!.add(m.away_team.toLowerCase().trim())
    }
  }

  // Fetch all knockout predictions for this game
  const { data: predictions } = await supabase
    .from('knockout_predictions')
    .select('id, round, team_name, points_awarded')
    .eq('game_id', gameId)

  if (!predictions) return

  // Update points for each prediction
  for (const pred of predictions) {
    const actual = actualTeamsByRound.get(pred.round)
    const isCorrect = actual?.has(pred.team_name.toLowerCase().trim()) ?? false
    const pts = isCorrect ? (KNOCKOUT_ROUND_POINTS[pred.round] ?? 0) : 0

    if (pred.points_awarded !== pts) {
      await supabase
        .from('knockout_predictions')
        .update({ 
          points_awarded: pts,
          updated_at: new Date().toISOString()
        })
        .eq('id', pred.id)
    }
  }
}

import { getProvider } from '@/lib/providers'

export async function syncMatchesWithProvider(groupId: string, gameId: string, _formData: FormData) {
  const supabase = await createClient()

  const { data: game } = await supabase
    .from('games')
    .select('tournament_type, id')
    .eq('id', gameId)
    .single()

  if (!game) {
    console.error('Spelet hittades inte.')
    return
  }

  const { data: dbMatches } = await supabase
    .from('matches')
    .select('*, match_goals(*)')
    .eq('game_id', gameId)

  if (!dbMatches) {
    console.error('Kunde inte hämta befintliga matcher.')
    return
  }
  
  const sourceProvider = dbMatches[0]?.source_provider || 'open_football'

  try {
    const provider = getProvider(sourceProvider)
    const allLiveMatches = await provider.fetchMatches(game.tournament_type)

    // Filter out knockout matches with placeholder names (e.g., "Winner Group A", "W49", "TBD")
    // to avoid cluttering the interface with undecided matches.
    const isPlaceholder = (name: string) => {
      if (!name) return true
      const n = name.toLowerCase()
      return n.includes('winner') || 
             n.includes('loser') || 
             n.includes('tbd') || 
             /^w\d+$/.test(n) || 
             /^l\d+$/.test(n) ||
             n.includes('match') // e.g. "Match 49"
    }

    const liveMatches = allLiveMatches.filter(m => {
      const isKnockout = m.stage && (
        m.stage.toLowerCase().includes('round') || 
        m.stage.toLowerCase().includes('final') || 
        m.stage.toLowerCase().includes('quarter') || 
        m.stage.toLowerCase().includes('semi') ||
        m.stage.toLowerCase().includes('play-off')
      )

      // We now allow knockout matches even with placeholders, 
      // so the admin can see the schedule/bracket early.
      return true
    })

    for (const liveMatch of liveMatches) {
      const isKnockout = liveMatch.stage && (
        liveMatch.stage.toLowerCase().includes('round') || 
        liveMatch.stage.toLowerCase().includes('final') || 
        liveMatch.stage.toLowerCase().includes('quarter') || 
        liveMatch.stage.toLowerCase().includes('semi') ||
        liveMatch.stage.toLowerCase().includes('play-off')
      )

      const existingMatch = dbMatches.find(m => {
        const normalize = (s: string | null | undefined) => s?.trim().toLowerCase() || ''
        
        // 1. Match by official API match number (most reliable)
        if (isKnockout && liveMatch.api_match_num && m.api_match_num === liveMatch.api_match_num) {
          return true
        }

        // 2. Match by external ID
        if (m.external_match_id === liveMatch.external_match_id) {
          return true
        }

        // 3. Match by teams (works for group stage and already-resolved knockouts)
        if (normalize(m.home_team) === normalize(liveMatch.home_team) && 
            normalize(m.away_team) === normalize(liveMatch.away_team)) {
          return true
        }

        // 4. Knockout placeholder matching (e.g., "1H" vs "2J")
        // Stricter check: only match if both teams and stage match
        if (isKnockout && normalize(m.stage) === normalize(liveMatch.stage)) {
          if (normalize(m.home_team) === normalize(liveMatch.home_team) && 
              normalize(m.away_team) === normalize(liveMatch.away_team)) {
            return true
          }
        }

        // 5. Knockout fallback: Match by stage + exact kickoff time + one of the teams
        // This is useful if the API has "Sweden" but DB still has "W97"
        if (isKnockout && normalize(m.stage) === normalize(liveMatch.stage)) {
          const dbTime = new Date(m.kickoff_time).getTime()
          const liveTime = new Date(liveMatch.kickoff_time).getTime()
          
          if (Math.abs(dbTime - liveTime) < 60 * 1000) { // Within 1 minute
            // Check if at least one placeholder matches the "W{num}" logic
            const wHome = `w${liveMatch.api_match_num}`
            const wAway = `w${liveMatch.api_match_num}`
            if (normalize(m.home_team) === wHome || normalize(m.away_team) === wAway) {
               return true
            }

            // Or if it's the only match at that exact time in that stage
            const otherMatchesAtSameTime = dbMatches.filter(other => 
              normalize(other.stage) === normalize(liveMatch.stage) && 
              Math.abs(new Date(other.kickoff_time).getTime() - liveTime) < 60 * 1000
            )
            if (otherMatchesAtSameTime.length === 1) {
              return true
            }
          }
        }

        return false
      })

      if (existingMatch) {
        const updateData: any = {
          kickoff_time: liveMatch.kickoff_time,
          venue: liveMatch.venue,
          provider_home_score: liveMatch.final_home_score,
          provider_away_score: liveMatch.final_away_score,
          provider_status: liveMatch.status,
          provider_home_team: liveMatch.home_team,
          provider_away_team: liveMatch.away_team,
          api_match_num: liveMatch.api_match_num,
          provider_goals: liveMatch.goals || null
        }

        if (liveMatch.broadcaster) {
          updateData.broadcaster = liveMatch.broadcaster
        }

        // If the manual override matches the API score and status, we can safely clear the override
        let isOverridden = existingMatch.is_manual_override
        if (isOverridden && 
            existingMatch.final_home_score === liveMatch.final_home_score && 
            existingMatch.final_away_score === liveMatch.final_away_score && 
            existingMatch.status === liveMatch.status) {
          isOverridden = false
          updateData.is_manual_override = false
        }

        // If the match is not overridden, we update teams/scores/status from the API
        if (!isOverridden) {
          // If we had a placeholder but now have a real team, update it
          if (isPlaceholder(existingMatch.home_team) && !isPlaceholder(liveMatch.home_team)) {
            updateData.home_team = liveMatch.home_team
          }
          if (isPlaceholder(existingMatch.away_team) && !isPlaceholder(liveMatch.away_team)) {
            updateData.away_team = liveMatch.away_team
          }

          updateData.final_home_score = liveMatch.final_home_score
          updateData.final_away_score = liveMatch.final_away_score
          updateData.status = liveMatch.status
        }

        // We sync the goals if the match is not overridden, OR if it has NO active goals in the database yet
        // (this automatically imports goals for previously played matches where goals were never registered).
        const activeGoals = (existingMatch as any).match_goals || []
        const shouldSyncGoals = !isOverridden || activeGoals.length === 0

        if (shouldSyncGoals) {
          // Synka målskyttar
          await supabase.from('match_goals').delete().eq('match_id', existingMatch.id)
          if (liveMatch.goals && liveMatch.goals.length > 0) {
            const dbGoals = liveMatch.goals.map(g => ({
              match_id: existingMatch.id,
              player_name: g.player_name,
              team_name: g.team_name,
              minute: g.minute,
              offset_minute: g.offset_minute ?? null,
              is_penalty: g.is_penalty ?? false,
              is_own_goal: g.is_own_goal ?? false
            }))
            await supabase.from('match_goals').insert(dbGoals)
          }
        }

        await supabase
          .from('matches')
          .update(updateData)
          .eq('id', existingMatch.id)
      } else {
        const { data: newMatch } = await supabase
          .from('matches')
          .insert({
            game_id: gameId,
            external_match_id: liveMatch.external_match_id,
            home_team: liveMatch.home_team,
            away_team: liveMatch.away_team,
            kickoff_time: liveMatch.kickoff_time,
            stage: liveMatch.stage,
            group_name: liveMatch.group_name,
            venue: liveMatch.venue,
            status: liveMatch.status,
            final_home_score: liveMatch.final_home_score,
            final_away_score: liveMatch.final_away_score,
            source_provider: sourceProvider,
            provider_home_score: liveMatch.final_home_score,
            provider_away_score: liveMatch.final_away_score,
            provider_status: liveMatch.status,
            provider_home_team: liveMatch.home_team,
            provider_away_team: liveMatch.away_team,
            api_match_num: liveMatch.api_match_num,
            broadcaster: liveMatch.broadcaster,
            provider_goals: liveMatch.goals || null
          })
          .select('id')
          .single()

        if (newMatch && liveMatch.goals && liveMatch.goals.length > 0) {
          const dbGoals = liveMatch.goals.map(g => ({
            match_id: newMatch.id,
            player_name: g.player_name,
            team_name: g.team_name,
            minute: g.minute,
            offset_minute: g.offset_minute ?? null,
            is_penalty: g.is_penalty ?? false,
            is_own_goal: g.is_own_goal ?? false
          }))
          await supabase.from('match_goals').insert(dbGoals)
        }
      }
    }

    // 2. ALSO Sync TV Channels from SVT
    try {
      const svtData = await fetchSvtBroadcasters()
      if (svtData) {
        const { svtMatches, svtPlaceholders } = svtData
        
        // Swedish to English mapping for common teams
        const teamMap: Record<string, string> = {
          "Mexiko": "Mexico", "Sydafrika": "South Africa", "Sydkorea": "South Korea",
          "Tjeckien": "Czech Republic", "Kanada": "Canada", "Bosnien och Hercegovina": "Bosnia & Herzegovina",
          "USA": "USA", "Paraguay": "Paraguay", "Qatar": "Qatar", "Schweiz": "Switzerland",
          "Brasilien": "Brazil", "Marocko": "Morocco", "Skottland": "Scotland", "Haiti": "Haiti",
          "Australien": "Australia", "Turkiet": "Turkey", "Tyskland": "Germany", "Curacao": "Curaçao",
          "Nederländerna": "Netherlands", "Japan": "Japan", "Elfenbenskusten": "Ivory Coast",
          "Ecuador": "Ecuador", "Sverige": "Sweden", "Tunisien": "Tunisia", "Spanien": "Spain",
          "Kap Verde": "Cape Verde", "Belgien": "Belgium", "Egypten": "Egypt", "Saudiarabien": "Saudi Arabia",
          "Uruguay": "Uruguay", "Iran": "Iran", "Nya Zeeland": "New Zealand", "Frankrike": "France",
          "Senegal": "Senegal", "Irak": "Iraq", "Norge": "Norway", "Argentina": "Argentina",
          "Algeriet": "Algeria", "Österrike": "Austria", "Jordanien": "Jordan", "Portugal": "Portugal",
          "DR Kongo": "DR Congo", "England": "England", "Kroatien": "Croatia", "Ghana": "Ghana",
          "Panama": "Panama", "Uzbekistan": "Uzbekistan", "Colombia": "Colombia"
        }

        // First, reset all to TV4 for this game
        await supabase.from('matches').update({ broadcaster: 'TV4' }).eq('game_id', gameId)

        // Apply SVT updates for team matches
        for (const [t1, t2] of svtMatches) {
          const t1En = teamMap[t1] || t1
          const t2En = teamMap[t2] || t2
          
          await supabase.from('matches')
            .update({ broadcaster: 'SVT' })
            .eq('game_id', gameId)
            .or(`and(home_team.eq."${t1En}",away_team.eq."${t2En}"),and(home_team.eq."${t2En}",away_team.eq."${t1En}")`)
          
          // Also try Swedish names just in case they are in DB
          if (t1En !== t1 || t2En !== t2) {
            await supabase.from('matches')
              .update({ broadcaster: 'SVT' })
              .eq('game_id', gameId)
              .or(`and(home_team.eq."${t1}",away_team.eq."${t2}"),and(home_team.eq."${t2}",away_team.eq."${t1}")`)
          }
        }

        // Apply SVT updates for placeholders
        for (const p of svtPlaceholders) {
          const [ph, pa] = p.split(/[–-]/).map(s => s.trim())
          await supabase.from('matches')
            .update({ broadcaster: 'SVT' })
            .eq('game_id', gameId)
            .or(`and(home_team.eq."${ph}",away_team.eq."${pa}"),and(home_team.eq."${pa}",away_team.eq."${ph}")`)
        }
      }
    } catch (e) {
      console.error('Error syncing TV channels:', e)
    }
    
    revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin`)
    
    // Trigger calculation so knockout points are updated if new teams were identified
    await calculateScores(groupId, gameId)

    return { success: true, message: `Matcherna och TV-kanalerna har synkats!` }
  } catch (err: any) {
    console.error('Sync error:', err)
    return { error: 'Synkning misslyckades: ' + err.message }
  }
}

export async function syncSingleMatchWithProvider(
  groupId: string,
  gameId: string,
  matchId: string
) {
  const supabase = await createClient()

  // Verify that the current user is an admin of the group
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ej inloggad.' }

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return { error: 'Ej behörig att synka matcher.' }
  }

  const { data: game } = await supabase
    .from('games')
    .select('tournament_type, id')
    .eq('id', gameId)
    .single()

  if (!game) {
    return { error: 'Spelet hittades inte.' }
  }

  // Get the single match from DB
  const { data: dbMatch } = await supabase
    .from('matches')
    .select('*, match_goals(*)')
    .eq('id', matchId)
    .eq('game_id', gameId)
    .single()

  if (!dbMatch) {
    return { error: 'Matchen hittades inte.' }
  }

  const sourceProvider = dbMatch.source_provider || 'open_football'

  try {
    const provider = getProvider(sourceProvider)
    const allLiveMatches = await provider.fetchMatches(game.tournament_type)

    const isPlaceholder = (name: string) => {
      if (!name) return true
      const n = name.toLowerCase()
      return n.includes('winner') || 
             n.includes('loser') || 
             n.includes('tbd') || 
             /^w\d+$/.test(n) || 
             /^l\d+$/.test(n) ||
             n.includes('match')
    }

    // Match logic corresponding to syncMatchesWithProvider
    const liveMatch = allLiveMatches.find(m => {
      const normalize = (s: string | null | undefined) => s?.trim().toLowerCase() || ''
      const isKnockout = m.stage && (
        m.stage.toLowerCase().includes('round') || 
        m.stage.toLowerCase().includes('final') || 
        m.stage.toLowerCase().includes('quarter') || 
        m.stage.toLowerCase().includes('semi') ||
        m.stage.toLowerCase().includes('play-off')
      )

      if (isKnockout && m.api_match_num && dbMatch.api_match_num === m.api_match_num) {
        return true
      }

      if (dbMatch.external_match_id === m.external_match_id) {
        return true
      }

      if (normalize(dbMatch.home_team) === normalize(m.home_team) && 
          normalize(dbMatch.away_team) === normalize(m.away_team)) {
        return true
      }

      if (isKnockout && normalize(dbMatch.stage) === normalize(m.stage)) {
        if (normalize(dbMatch.home_team) === normalize(m.home_team) && 
            normalize(dbMatch.away_team) === normalize(m.away_team)) {
          return true
        }
      }

      if (isKnockout && normalize(dbMatch.stage) === normalize(m.stage)) {
        const dbTime = new Date(dbMatch.kickoff_time).getTime()
        const liveTime = new Date(m.kickoff_time).getTime()
        
        if (Math.abs(dbTime - liveTime) < 60 * 1000) {
          const wHome = `w${m.api_match_num}`
          const wAway = `w${m.api_match_num}`
          if (normalize(dbMatch.home_team) === wHome || normalize(dbMatch.away_team) === wAway) {
             return true
          }
        }
      }

      return false
    })

    if (!liveMatch) {
      return { error: 'Kunde inte hitta motsvarande match hos leverantören.' }
    }

    const updateData: Record<string, unknown> = {
      kickoff_time: liveMatch.kickoff_time,
      venue: liveMatch.venue,
      provider_home_score: liveMatch.final_home_score,
      provider_away_score: liveMatch.final_away_score,
      provider_status: liveMatch.status,
      provider_home_team: liveMatch.home_team,
      provider_away_team: liveMatch.away_team,
      api_match_num: liveMatch.api_match_num,
      provider_goals: liveMatch.goals || null
    }

    let updatedBroadcaster = dbMatch.broadcaster || 'TV4'
    try {
      const svtData = await fetchSvtBroadcasters()
      if (svtData) {
        const { svtMatches, svtPlaceholders } = svtData
        
        const teamMap: Record<string, string> = {
          "Mexiko": "Mexico", "Sydafrika": "South Africa", "Sydkorea": "South Korea",
          "Tjeckien": "Czech Republic", "Kanada": "Canada", "Bosnien och Hercegovina": "Bosnia & Herzegovina",
          "USA": "USA", "Paraguay": "Paraguay", "Qatar": "Qatar", "Schweiz": "Switzerland",
          "Brasilien": "Brazil", "Marocko": "Morocco", "Skottland": "Scotland", "Haiti": "Haiti",
          "Australien": "Australia", "Turkiet": "Turkey", "Tyskland": "Germany", "Curacao": "Curaçao",
          "Nederländerna": "Netherlands", "Japan": "Japan", "Elfenbenskusten": "Ivory Coast",
          "Ecuador": "Ecuador", "Sverige": "Sweden", "Tunisien": "Tunisia", "Spanien": "Spain",
          "Kap Verde": "Cape Verde", "Belgien": "Belgium", "Egypten": "Egypt", "Saudiarabien": "Saudi Arabia",
          "Uruguay": "Uruguay", "Iran": "Iran", "Nya Zeeland": "New Zealand", "Frankrike": "France",
          "Senegal": "Senegal", "Irak": "Iraq", "Norge": "Norway", "Argentina": "Argentina",
          "Algeriet": "Algeria", "Österrike": "Austria", "Jordanien": "Jordan", "Portugal": "Portugal",
          "DR Kongo": "DR Congo", "England": "England", "Kroatien": "Croatia", "Ghana": "Ghana",
          "Panama": "Panama", "Uzbekistan": "Uzbekistan", "Colombia": "Colombia"
        }

        const h = liveMatch.home_team
        const a = liveMatch.away_team
        const normH = h?.toLowerCase().trim()
        const normA = a?.toLowerCase().trim()

        const isSvt = svtMatches.some(([t1, t2]) => {
          const t1En = (teamMap[t1] || t1).toLowerCase().trim()
          const t2En = (teamMap[t2] || t2).toLowerCase().trim()
          const t1Sv = t1.toLowerCase().trim()
          const t2Sv = t2.toLowerCase().trim()

          return (
            (t1En === normH && t2En === normA) || (t1En === normA && t2En === normH) ||
            (t1Sv === normH && t2Sv === normA) || (t1Sv === normA && t2Sv === normH)
          )
        })

        const isSvtKnockout = svtPlaceholders.some(p => {
          const [ph, pa] = p.split(/[–-]/).map(s => s.trim().toLowerCase())
          return (
            (ph === normH && pa === normA) || (ph === normA && pa === normH)
          )
        })

        if (isSvt || isSvtKnockout) {
          updatedBroadcaster = 'SVT'
        } else {
          updatedBroadcaster = 'TV4'
        }
      }
    } catch (e) {
      console.error('Error fetching SVT channel for single match:', e)
    }

    updateData.broadcaster = updatedBroadcaster

    let isOverridden = dbMatch.is_manual_override
    if (isOverridden && 
        dbMatch.final_home_score === liveMatch.final_home_score && 
        dbMatch.final_away_score === liveMatch.final_away_score && 
        dbMatch.status === liveMatch.status) {
      isOverridden = false
      updateData.is_manual_override = false
    }

    if (!isOverridden) {
      if (isPlaceholder(dbMatch.home_team) && !isPlaceholder(liveMatch.home_team)) {
        updateData.home_team = liveMatch.home_team
      }
      if (isPlaceholder(dbMatch.away_team) && !isPlaceholder(liveMatch.away_team)) {
        updateData.away_team = liveMatch.away_team
      }

      updateData.final_home_score = liveMatch.final_home_score
      updateData.final_away_score = liveMatch.final_away_score
      updateData.status = liveMatch.status
    }

    const activeGoals = dbMatch.match_goals || []
    const shouldSyncGoals = !isOverridden || activeGoals.length === 0

    if (shouldSyncGoals) {
      await supabase.from('match_goals').delete().eq('match_id', dbMatch.id)
      if (liveMatch.goals && liveMatch.goals.length > 0) {
        const dbGoals = liveMatch.goals.map(g => ({
          match_id: dbMatch.id,
          player_name: g.player_name,
          team_name: g.team_name,
          minute: g.minute,
          offset_minute: g.offset_minute ?? null,
          is_penalty: g.is_penalty ?? false,
          is_own_goal: g.is_own_goal ?? false
        }))
        await supabase.from('match_goals').insert(dbGoals)
      }
    }

    await supabase
      .from('matches')
      .update(updateData)
      .eq('id', dbMatch.id)

    await calculateScores(groupId, gameId)

    revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin`)

    return { success: true, message: `Matchen ${liveMatch.home_team} - ${liveMatch.away_team} har synkats!` }
  } catch (err: unknown) {
    console.error('Single match sync error:', err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    return { error: 'Synkning misslyckades: ' + errorMessage }
  }
}

export async function toggleMatchAutoSync(
  groupId: string,
  gameId: string,
  matchId: string,
  currentDisabledState: boolean
) {
  const supabase = await createClient()

  // Verify that the current user is an admin of the group
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ej inloggad.' }

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return { error: 'Ej behörig.' }
  }

  const { error } = await supabase
    .from('matches')
    .update({ disable_auto_sync: !currentDisabledState })
    .eq('id', matchId)
    .eq('game_id', gameId)

  if (error) {
    return { error: 'Kunde inte uppdatera synk-inställning: ' + error.message }
  }

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin`)
  return { success: true, message: `Auto-synk har ${!currentDisabledState ? 'inaktiverats' : 'aktiverats'} för matchen.` }
}

export async function acceptApiResult(groupId: string, gameId: string, matchId: string, _formData: FormData) {
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('matches')
    .select('provider_home_score, provider_away_score, provider_status, provider_home_team, provider_away_team, provider_goals')
    .eq('id', matchId)
    .single()

  if (!match) return;

  await supabase
    .from('matches')
    .update({
      final_home_score: match.provider_home_score,
      final_away_score: match.provider_away_score,
      status: match.provider_status ?? 'finished',
      home_team: match.provider_home_team,
      away_team: match.provider_away_team,
      is_manual_override: false
    })
    .eq('id', matchId)

  // Återställ målskyttar från cached provider_goals
  await supabase.from('match_goals').delete().eq('match_id', matchId)
  const apiGoals = match.provider_goals as any[] | null
  if (Array.isArray(apiGoals) && apiGoals.length > 0) {
    const dbGoals = apiGoals.map(g => ({
      match_id: matchId,
      player_name: g.player_name,
      team_name: g.team_name,
      minute: g.minute,
      offset_minute: g.offset_minute ?? null,
      is_penalty: g.is_penalty ?? false,
      is_own_goal: g.is_own_goal ?? false
    }))
    await supabase.from('match_goals').insert(dbGoals)
  }

  await calculateScores(groupId, gameId)
  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin`)
}

export async function deleteMatch(groupId: string, gameId: string, matchId: string, _formData: FormData) {
  const supabase = await createClient()

  await supabase
    .from('matches')
    .delete()
    .eq('id', matchId)

  // Efter borttagning måste vi eventuellt beräkna om poängen 
  // eftersom totala möjliga poäng eller användares poäng kan ha ändrats
  await calculateScores(groupId, gameId)

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin`)
}
