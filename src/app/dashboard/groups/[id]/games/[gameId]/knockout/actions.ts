'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { KNOCKOUT_ROUNDS, KNOCKOUT_ROUND_POINTS } from '@/lib/scoring/knockout'

const revalidate = (groupId: string, gameId: string) =>
  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/knockout`)

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
    const teamCount = round.teamCount
    for (let i = 0; i < teamCount; i++) {
      const val = formData.get(`${round.key}_${i}`) as string
      if (val && val.trim()) {
        rows.push({
          user_id: user.id,
          group_id: groupId,
          game_id: gameId,
          round: round.key,
          team_name: val.trim(),
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

  // Recalculate all user points
  await recalculateKnockoutPoints(gameId, supabase)

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/knockout`)
  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/knockout/admin`)
  return { success: true, message: 'Faktiska lag sparade och poäng beräknade!' }
}

// ─── Internal: Recalculate points for all users ───────────────────────────────

async function recalculateKnockoutPoints(gameId: string, supabase: any) {
  const { data: actualTeams } = await supabase
    .from('knockout_actual_teams')
    .select('round, team_name')
    .eq('game_id', gameId)

  if (!actualTeams || actualTeams.length === 0) return

  const { data: allPredictions } = await supabase
    .from('knockout_predictions')
    .select('id, user_id, round, team_name')
    .eq('game_id', gameId)

  if (!allPredictions) return

  const actualByRound = new Map<string, Set<string>>()
  for (const at of actualTeams) {
    if (!actualByRound.has(at.round)) actualByRound.set(at.round, new Set())
    actualByRound.get(at.round)!.add(at.team_name.toLowerCase().trim())
  }

  for (const pred of allPredictions) {
    const actual = actualByRound.get(pred.round)
    const isCorrect = actual?.has(pred.team_name.toLowerCase().trim()) ?? false
    const pts = isCorrect ? (KNOCKOUT_ROUND_POINTS[pred.round] ?? 0) : 0
    await supabase
      .from('knockout_predictions')
      .update({ points_awarded: pts })
      .eq('id', pred.id)
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
