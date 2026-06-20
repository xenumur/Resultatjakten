import { createClient, createAdminClient } from '@/lib/supabase/server'

export interface LeaderboardEntry {
  user_id: string
  display_name?: string
  total_points: number
  rank: number
  previous_rank?: number | null
  previous_points?: number | null
}

/**
 * Calculates the current leaderboard for a group.
 * Does not update the database.
 */
export async function getGroupLeaderboard(groupId: string): Promise<LeaderboardEntry[]> {
  const supabase = createAdminClient() // Use admin client for consistent reading

  const [
    { data: members },
    { data: matchPredictions },
    { data: knockoutPredictions },
    { data: bonusAnswers }
  ] = await Promise.all([
    supabase.from('group_members').select('user_id, previous_rank, previous_points, profiles:user_id(display_name)').eq('group_id', groupId),
    supabase.from('predictions').select('user_id, points_awarded').eq('group_id', groupId),
    supabase.from('knockout_predictions').select('user_id, points_awarded').eq('group_id', groupId),
    supabase.from('bonus_answers').select('user_id, points_awarded, bonus_questions!inner(group_id)').eq('bonus_questions.group_id', groupId)
  ])

  if (!members || members.length === 0) return []

  const userScores: Record<string, number> = {}
  for (const m of members) {
    userScores[m.user_id] = 0
  }

  for (const p of matchPredictions || []) {
    if (userScores[p.user_id] !== undefined) {
      userScores[p.user_id] += (p.points_awarded || 0)
    }
  }

  for (const p of knockoutPredictions || []) {
    if (userScores[p.user_id] !== undefined) {
      userScores[p.user_id] += (p.points_awarded || 0)
    }
  }

  for (const a of bonusAnswers || []) {
    if (userScores[a.user_id] !== undefined) {
      userScores[a.user_id] += (a.points_awarded || 0)
    }
  }

  const leaderboard = Object.entries(userScores)
    .map(([user_id, total_points]) => {
      const member = members.find(m => m.user_id === user_id)
      return { 
        user_id, 
        total_points,
        display_name: (member?.profiles as any)?.display_name || 'Okänd deltagare',
        previous_rank: member?.previous_rank,
        previous_points: member?.previous_points
      }
    })
    .sort((a, b) => b.total_points - a.total_points)

  let currentRank = 1
  const rankedLeaderboard = leaderboard.map((entry, i) => {
    if (i > 0 && entry.total_points < leaderboard[i - 1].total_points) {
      currentRank = i + 1
    }
    return { ...entry, rank: currentRank }
  })

  return rankedLeaderboard
}

/**
 * Snapshots the current leaderboard and saves it as 'previous_rank'.
 * This is used BEFORE point updates to have a baseline for comparisons.
 */
export async function snapshotGroupLeaderboard(groupId: string) {
  const supabase = createAdminClient()
  const leaderboard = await getGroupLeaderboard(groupId)

  // Batch update previous ranks & points
  for (const entry of leaderboard) {
    await supabase
      .from('group_members')
      .update({ 
        previous_rank: entry.rank,
        previous_points: entry.total_points
      })
      .eq('group_id', groupId)
      .eq('user_id', entry.user_id)
  }

  return leaderboard
}

/**
 * Prepares a leaderboard snapshot to detect changes.
 * Returns a function that, when called, will save the snapshot as the previous state
 * ONLY if the current leaderboard has actually changed.
 */
export async function prepareLeaderboardSnapshot(groupId: string) {
  const supabase = createAdminClient()
  const snapshot = await getGroupLeaderboard(groupId)

  return async () => {
    const currentLeaderboard = await getGroupLeaderboard(groupId)
    
    // Check if any user's points or rank has changed
    let hasChanged = false
    for (const entry of currentLeaderboard) {
      const snapEntry = snapshot.find(s => s.user_id === entry.user_id)
      if (!snapEntry || snapEntry.total_points !== entry.total_points || snapEntry.rank !== entry.rank) {
        hasChanged = true
        break
      }
    }

    if (hasChanged) {
      // Batch update previous ranks & points
      for (const entry of snapshot) {
        await supabase
          .from('group_members')
          .update({ 
            previous_rank: entry.rank,
            previous_points: entry.total_points
          })
          .eq('group_id', groupId)
          .eq('user_id', entry.user_id)
      }
    }
  }
}

