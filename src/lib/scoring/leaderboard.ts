import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendPersonalNotification } from '@/lib/notifications/service'

export interface LeaderboardEntry {
  user_id: string
  total_points: number
  rank: number
  previous_rank?: number | null
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
    supabase.from('group_members').select('user_id, previous_rank').eq('group_id', groupId),
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
    .map(([user_id, total_points]) => ({ 
      user_id, 
      total_points,
      previous_rank: members.find(m => m.user_id === user_id)?.previous_rank
    }))
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

  // Batch update previous ranks
  for (const entry of leaderboard) {
    await supabase
      .from('group_members')
      .update({ previous_rank: entry.rank })
      .eq('group_id', groupId)
      .eq('user_id', entry.user_id)
  }

  return leaderboard
}

/**
 * Compares old and new leaderboard states and sends notifications to members whose points changed.
 */
export async function notifyLeaderboardChanges(
  groupId: string,
  oldLeaderboard: LeaderboardEntry[],
  newLeaderboard: LeaderboardEntry[]
) {
  const supabase = createAdminClient()
  
  // Fetch notification preferences for all users in the group
  const userIds = newLeaderboard.map(e => e.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, notify_on_points_change')
    .in('id', userIds)

  for (const newEntry of newLeaderboard) {
    const oldEntry = oldLeaderboard.find(o => o.user_id === newEntry.user_id)
    const profile = profiles?.find(p => p.id === newEntry.user_id)
    
    // Check if user has opted out of point notifications
    if (profile && profile.notify_on_points_change === false) continue

    // Only notify if points have actually changed
    if (!oldEntry || newEntry.total_points !== oldEntry.total_points) {
      const rankMsg = newEntry.rank === 1 ? '1:a' : `${newEntry.rank}:e`
      
      await sendPersonalNotification({
        userId: newEntry.user_id,
        groupId,
        title: 'Poänguppdatering!',
        content: `Dina poäng har ändrats! Du ligger nu på ${rankMsg} plats med ${newEntry.total_points} poäng.`
      })
    }
  }
}
