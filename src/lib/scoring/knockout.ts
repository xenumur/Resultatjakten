/**
 * Poängregler för Slutspelstips.
 * Kan justeras för att stödja strikt bracket-logik i framtiden.
 */
export const KNOCKOUT_ROUND_POINTS: Record<string, number> = {
  round_of_32:   1,
  round_of_16:   2,
  quarter_final: 4,
  semi_final:    6,
  third_place:   8,
  final:         10,
}

export const KNOCKOUT_ROUNDS = [
  { key: 'round_of_32',   label: 'Sextondelsfinal', teamCount: 32, emoji: '🟣' },
  { key: 'round_of_16',   label: 'Åttondelsfinal', teamCount: 16, emoji: '🔵' },
  { key: 'quarter_final', label: 'Kvartsfinal',     teamCount: 8,  emoji: '🟡' },
  { key: 'semi_final',    label: 'Semifinal',       teamCount: 4,  emoji: '🟠' },
  { key: 'third_place',   label: 'Bronsmatch',      teamCount: 2,  emoji: '🥉' },
  { key: 'final',         label: 'Final',           teamCount: 2,  emoji: '🏆' },
] as const

export type KnockoutRoundKey = typeof KNOCKOUT_ROUNDS[number]['key']

export interface KnockoutPrediction {
  user_id: string
  round: string
  team_name: string
}

export interface KnockoutActualTeam {
  round: string
  team_name: string
}

export interface KnockoutUserScore {
  user_id: string
  total_points: number
  points_by_round: Record<string, number>
  correct_by_round: Record<string, string[]>
}

/**
 * Beräknar poäng för en enda användare baserat på MVP-logiken:
 * rätt lag per runda, oavsett position i bracket.
 */
export function calculateKnockoutPoints(
  predictions: KnockoutPrediction[],
  actualTeams: KnockoutActualTeam[],
): KnockoutUserScore {
  const userId = predictions[0]?.user_id ?? ''
  const pointsByRound: Record<string, number> = {}
  const correctByRound: Record<string, string[]> = {}
  let totalPoints = 0

  for (const round of KNOCKOUT_ROUNDS) {
    const pointsPerTeam = KNOCKOUT_ROUND_POINTS[round.key] ?? 0

    const predicted = new Set(
      predictions
        .filter(p => p.round === round.key)
        .map(p => p.team_name.toLowerCase().trim())
    )

    const actual = new Set(
      actualTeams
        .filter(a => a.round === round.key)
        .map(a => a.team_name.toLowerCase().trim())
    )

    const correct: string[] = []
    for (const team of predicted) {
      if (actual.has(team)) {
        correct.push(team)
        totalPoints += pointsPerTeam
      }
    }

    pointsByRound[round.key] = correct.length * pointsPerTeam
    correctByRound[round.key] = correct
  }

  return { user_id: userId, total_points: totalPoints, points_by_round: pointsByRound, correct_by_round: correctByRound }
}

/**
 * Beräknar leaderboard för alla användare.
 */
export function calculateKnockoutLeaderboard(
  allPredictions: KnockoutPrediction[],
  actualTeams: KnockoutActualTeam[],
  userNames: Record<string, string>,
): Array<KnockoutUserScore & { display_name: string; rank: number }> {
  const byUser = new Map<string, KnockoutPrediction[]>()

  for (const pred of allPredictions) {
    if (!byUser.has(pred.user_id)) byUser.set(pred.user_id, [])
    byUser.get(pred.user_id)!.push(pred)
  }

  const scores = Array.from(byUser.entries()).map(([userId, preds]) => ({
    ...calculateKnockoutPoints(preds, actualTeams),
    user_id: userId,
    display_name: userNames[userId] ?? 'Okänd',
  }))

  scores.sort((a, b) => b.total_points - a.total_points)

  return scores.map((s, i) => ({ ...s, rank: i + 1 }))
}
