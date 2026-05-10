'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePrediction(
  groupId: string, 
  gameId: string, 
  matchId: string, 
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Du måste vara inloggad.' }
  }

  const homeScoreStr = formData.get('homeScore') as string;
  const awayScoreStr = formData.get('awayScore') as string;

  if (!homeScoreStr || !awayScoreStr) {
    return { error: 'Båda målen måste fyllas i.' }
  }

  const predictedHomeScore = parseInt(homeScoreStr, 10);
  const predictedAwayScore = parseInt(awayScoreStr, 10);

  const { data: match } = await supabase
    .from('matches')
    .select('kickoff_time, status')
    .eq('id', matchId)
    .single()

  if (!match) return { error: 'Matchen hittades inte.' }

  if (new Date(match.kickoff_time) < new Date() || match.status !== 'upcoming') {
    return { error: 'Matchen har redan börjat, du kan inte ändra ditt tips.' }
  }

  const { error } = await supabase
    .from('predictions')
    .upsert({
      user_id: user.id,
      group_id: groupId,
      game_id: gameId,
      match_id: matchId,
      predicted_home_score: predictedHomeScore,
      predicted_away_score: predictedAwayScore,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id, match_id'
    })

  if (error) {
    return { error: 'Kunde inte spara tipset: ' + error.message }
  }

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/predictions`)
  return { success: true }
}

export async function saveAllPredictions(
  groupId: string, 
  gameId: string, 
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.error('Du måste vara inloggad.')
    return
  }

  // Hämta spelet för att veta vilka stages som är manuellt låsta
  const { data: game } = await supabase
    .from('games')
    .select('locked_stages')
    .eq('id', gameId)
    .single()
    
  const lockedStages = game?.locked_stages || []

  // Hämta matcher för att verifiera kickoff_time
  const { data: matches } = await supabase
    .from('matches')
    .select('id, kickoff_time, status, stage, group_name')
    .eq('game_id', gameId)

  if (!matches) {
    console.error('Inga matcher hittades.')
    return
  }
  const matchMap = new Map(matches.map(m => [m.id, m]))

  const predictionsToUpsert = []
  const scoreData: Record<string, { home?: string, away?: string }> = {}

  for (const [key, value] of Array.from(formData.entries())) {
    if (key.startsWith('homeScore_')) {
      const matchId = key.replace('homeScore_', '')
      if (!scoreData[matchId]) scoreData[matchId] = {}
      scoreData[matchId].home = value as string
    } else if (key.startsWith('awayScore_')) {
      const matchId = key.replace('awayScore_', '')
      if (!scoreData[matchId]) scoreData[matchId] = {}
      scoreData[matchId].away = value as string
    } else if (key.startsWith('homeTeam_')) {
      const matchId = key.replace('homeTeam_', '')
      if (!scoreData[matchId]) scoreData[matchId] = {}
      ;(scoreData[matchId] as any).homeTeam = value as string
    } else if (key.startsWith('awayTeam_')) {
      const matchId = key.replace('awayTeam_', '')
      if (!scoreData[matchId]) scoreData[matchId] = {}
      ;(scoreData[matchId] as any).awayTeam = value as string
    }
  }

  for (const matchId of Object.keys(scoreData)) {
    const { home, away } = scoreData[matchId]
    const { homeTeam, awayTeam } = scoreData[matchId] as any
    
    if (home !== undefined && away !== undefined && home !== '' && away !== '') {
      const match = matchMap.get(matchId)
      
      if (match) {
        const isManuallyLocked = lockedStages.includes(match.stage) || lockedStages.includes(match.group_name)
        const isTimeLocked = new Date(match.kickoff_time) <= new Date()
        
        if (!isManuallyLocked && !isTimeLocked && match.status === 'upcoming') {
          predictionsToUpsert.push({
            user_id: user.id,
            group_id: groupId,
            game_id: gameId,
            match_id: matchId,
            predicted_home_score: parseInt(home, 10),
            predicted_away_score: parseInt(away, 10),
            predicted_home_team: homeTeam || null,
            predicted_away_team: awayTeam || null,
            updated_at: new Date().toISOString()
          })
        }
      }
    }
  }

  if (predictionsToUpsert.length > 0) {
    const { error } = await supabase
      .from('predictions')
      .upsert(predictionsToUpsert, { onConflict: 'user_id, match_id' })

    if (error) {
      console.error(error)
    }
  }

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/predictions`)
}
