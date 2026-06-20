'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { KNOCKOUT_ROUNDS, KNOCKOUT_ROUND_POINTS } from '@/lib/scoring/knockout'

const revalidate = (groupId: string, gameId: string) =>
  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/knockout`)

// Stage name in DB → internal round key used in knockout_predictions
const STAGE_TO_ROUND: Record<string, string> = {
  'Round of 32':           'round_of_32',
  'Round of 16':           'round_of_16',
  'Quarter-final':         'quarter_final',
  'Semi-final':            'semi_final',
  'Match for third place': 'third_place',
  'Final':                 'final',
}

function isPlaceholder(name: string) {
  if (!name) return true
  return /^[WL]\d+$/.test(name) || /^(winner|loser|tbd)/i.test(name)
}

// ─── User: Save all picks in one bulk action ──────────────────────────────────

export async function saveKnockoutPredictions(
  groupId: string,
  gameId: string,
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Inte inloggad' }

  // Check if knockout is locked
  const { data: settings } = await supabase
    .from('knockout_settings')
    .select('is_locked')
    .eq('game_id', gameId)
    .single()

  if (settings?.is_locked) return { error: 'Tipsen är låsta' }

  // Delete existing predictions and re-insert
  await supabase
    .from('knockout_predictions')
    .delete()
    .eq('user_id', user.id)
    .eq('game_id', gameId)

  const rows: Array<{ user_id: string; group_id: string; game_id: string; round: string; team_name: string }> = []

  for (const round of KNOCKOUT_ROUNDS) {
    const roundPicks = new Set<string>()
    const teamCount = round.teamCount
    for (let i = 0; i < teamCount; i++) {
      const val = formData.get(`${round.key}_${i}`) as string
      if (val && val.trim()) {
        const team = val.trim()
        if (roundPicks.has(team)) {
          return { error: `Du kan inte välja samma lag flera gånger i ${round.label}` }
        }
        roundPicks.add(team)
        rows.push({
          user_id: user.id,
          group_id: groupId,
          game_id: gameId,
          round: round.key,
          team_name: team,
        })
      }
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('knockout_predictions').insert(rows)
    if (error) return { error: 'Kunde inte spara: ' + error.message }
  }

  revalidate(groupId, gameId)
  return { success: true, message: 'Dina slutspelstips har sparats!' }
}

// ─── Admin: Toggle lock ───────────────────────────────────────────────────────

export async function toggleKnockoutLock(groupId: string, gameId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Inte inloggad' }

  const { data: existing } = await supabase
    .from('knockout_settings')
    .select('*')
    .eq('game_id', gameId)
    .single()

  if (existing) {
    await supabase
      .from('knockout_settings')
      .update({ is_locked: !existing.is_locked, locked_at: !existing.is_locked ? new Date().toISOString() : null })
      .eq('game_id', gameId)
  } else {
    await supabase
      .from('knockout_settings')
      .insert({ game_id: gameId, is_locked: true, locked_at: new Date().toISOString() })
  }

  revalidate(groupId, gameId)
  return { success: true }
}

// ─── Admin: Save actual teams per round ──────────────────────────────────────

import { prepareLeaderboardSnapshot } from '@/lib/scoring/leaderboard'

export async function saveActualTeams(
  groupId: string,
  gameId: string,
  formData: FormData
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Inte inloggad' }

  for (const round of KNOCKOUT_ROUNDS) {
    // Remove existing actual teams for this round
    await supabase
      .from('knockout_actual_teams')
      .delete()
      .eq('game_id', gameId)
      .eq('round', round.key)

    const rows: Array<{ game_id: string; round: string; team_name: string }> = []
    for (let i = 0; i < round.teamCount; i++) {
      const val = formData.get(`actual_${round.key}_${i}`) as string
      if (val && val.trim()) {
        rows.push({ game_id: gameId, round: round.key, team_name: val.trim() })
      }
    }
    if (rows.length > 0) {
      await supabase.from('knockout_actual_teams').insert(rows)
    }
  }

  // Prepare leaderboard snapshot before calculating new points to detect changes
  const commitSnapshot = await prepareLeaderboardSnapshot(groupId)

  // Recalculate all user points
  await recalculateKnockoutPoints(gameId, supabase)

  // Commit snapshot if changes occurred
  await commitSnapshot()

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/knockout`)
  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/knockout/admin`)
  return { success: true, message: 'Faktiska lag sparade och poäng beräknade!' }
}

export async function forceRecalculateKnockoutPoints(groupId: string, gameId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ej inloggad' }

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return { error: 'Åtkomst nekad.' }
  }

  // Prepare leaderboard snapshot before calculating new points to detect changes
  const commitSnapshot = await prepareLeaderboardSnapshot(groupId)

  await recalculateKnockoutPoints(gameId, supabase)

  // Commit snapshot if changes occurred
  await commitSnapshot()

  revalidatePath(`/dashboard/groups/${groupId}`)
  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/knockout`)
  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/knockout/admin`)

  return { success: true, message: 'Poäng omräknade!' }
}


// ─── Recalculate points: uses BOTH manual actual_teams AND match data ─────────
// This means points are awarded automatically as soon as real teams appear
// in knockout stage matches, without needing admin to manually enter them.

export async function recalculateKnockoutPoints(gameId: string, supabase: any) {
  // Use admin client for updates so we can update ALL users' predictions,
  // not just the currently authenticated user (RLS UPDATE policy = auth.uid() = user_id)
  const adminClient = createAdminClient()

  // 1. Manual overrides from admin (knockout_actual_teams table)
  const { data: manualTeams } = await supabase
    .from('knockout_actual_teams')
    .select('round, team_name')
    .eq('game_id', gameId)

  // 2. Automatic: real teams derived from knockout stage match records
  const { data: knockoutMatches } = await supabase
    .from('matches')
    .select('stage, home_team, away_team')
    .eq('game_id', gameId)
    .in('stage', Object.keys(STAGE_TO_ROUND))

  const actualByRound = new Map<string, Set<string>>()

  // Add manual teams
  for (const at of manualTeams ?? []) {
    if (!actualByRound.has(at.round)) actualByRound.set(at.round, new Set())
    actualByRound.get(at.round)!.add(at.team_name.toLowerCase().trim())
  }

  // Add teams from matches (any team appearing in a knockout match qualifies for that round)
  for (const m of knockoutMatches ?? []) {
    const roundKey = STAGE_TO_ROUND[m.stage]
    if (!roundKey) continue
    if (!actualByRound.has(roundKey)) actualByRound.set(roundKey, new Set())
    if (m.home_team && !isPlaceholder(m.home_team)) {
      actualByRound.get(roundKey)!.add(m.home_team.toLowerCase().trim())
    }
    if (m.away_team && !isPlaceholder(m.away_team)) {
      actualByRound.get(roundKey)!.add(m.away_team.toLowerCase().trim())
    }
  }

  if (actualByRound.size === 0) return

  // Get all predictions for this game (using regular client — SELECT RLS allows group members)
  const { data: allPredictions } = await supabase
    .from('knockout_predictions')
    .select('id, user_id, round, team_name, points_awarded')
    .eq('game_id', gameId)

  if (!allPredictions) return

  // Update points using admin client to bypass RLS UPDATE restriction
  for (const pred of allPredictions) {
    const actual = actualByRound.get(pred.round)
    const isCorrect = actual?.has(pred.team_name.toLowerCase().trim()) ?? false
    const pts = isCorrect ? (KNOCKOUT_ROUND_POINTS[pred.round] ?? 0) : 0
    if ((pred as any).points_awarded !== pts) {
      await adminClient
        .from('knockout_predictions')
        .update({ 
          points_awarded: pts,
          updated_at: new Date().toISOString()
        })
        .eq('id', pred.id)
    }
  }
}

// ─── Admin: Initialize settings for a game ───────────────────────────────────

export async function ensureKnockoutSettings(gameId: string) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('knockout_settings')
    .select('id')
    .eq('game_id', gameId)
    .single()

  if (!existing) {
    await supabase.from('knockout_settings').insert({ game_id: gameId })
  }
}
