'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
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
    for (const matchId of Array.from(matchIds)) {
      const homeScoreStr = formData.get(`${matchId}_homeScore`) as string
      const awayScoreStr = formData.get(`${matchId}_awayScore`) as string
      const status = formData.get(`${matchId}_status`) as string

      if (homeScoreStr === null || awayScoreStr === null) continue

      const homeScore = parseInt(homeScoreStr, 10)
      const awayScore = parseInt(awayScoreStr, 10)

      await supabase
        .from('matches')
        .update({
          final_home_score: isNaN(homeScore) ? null : homeScore,
          final_away_score: isNaN(awayScore) ? null : awayScore,
          status: status,
          is_manual_override: true
        })
        .eq('id', matchId)
    }
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

  await supabase
    .from('matches')
    .update({
      final_home_score: isNaN(homeScore) ? null : homeScore,
      final_away_score: isNaN(awayScore) ? null : awayScore,
      status: status,
      is_manual_override: true
    })
    .eq('id', matchId)

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin`)
  return { success: true, message: 'Resultatet har uppdaterats.' }
}

export async function calculateScores(groupId: string, gameId: string, _formData?: FormData) {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('matches')
    .select('id, final_home_score, final_away_score, status, home_team, away_team')
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
          .update({ points_awarded: points })
          .eq('id', pred.id)
      }
    }
  }

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/leaderboard`)
  return { success: true, message: 'Poängen har räknats om för alla deltagare!' }
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
    .select('*')
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

      if (isKnockout && (isPlaceholder(m.home_team) || isPlaceholder(m.away_team))) {
        return false
      }
      return true
    })

    for (const liveMatch of liveMatches) {
      const existingMatch = dbMatches.find(m =>
        m.external_match_id === liveMatch.external_match_id ||
        (m.home_team === liveMatch.home_team && m.away_team === liveMatch.away_team)
      )

      if (existingMatch) {
        // Synk sparar ALLTID bara i provider_*-kolumnerna.
        // Det är alltid admins beslut att tillämpa försämringen.
        await supabase
          .from('matches')
          .update({
            kickoff_time: liveMatch.kickoff_time,
            venue: liveMatch.venue,
            provider_home_score: liveMatch.final_home_score,
            provider_away_score: liveMatch.final_away_score,
            provider_status: liveMatch.status,
            provider_home_team: liveMatch.home_team,
            provider_away_team: liveMatch.away_team,
          })
          .eq('id', existingMatch.id)
      } else {
        // Ny match – lägg in den med provider-data som startvärde
        await supabase
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
          })
      }
    }
    
    revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin`)
    return { success: true, message: `Matcherna har synkats med ${sourceProvider}!` }
  } catch (err: any) {
    console.error('Sync error:', err)
    return { error: 'Synkning misslyckades: ' + err.message }
  }
}

export async function acceptApiResult(groupId: string, gameId: string, matchId: string, _formData: FormData) {
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('matches')
    .select('provider_home_score, provider_away_score, provider_status, provider_home_team, provider_away_team')
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
