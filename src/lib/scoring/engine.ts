export interface Prediction {
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_home_team?: string | null;
  predicted_away_team?: string | null;
}

export interface MatchResult {
  final_home_score: number;
  final_away_score: number;
  home_team: string;
  away_team: string;
}

export interface ScoringRules {
  correct_team_score: number;
  correct_outcome: number;
  correct_team_guess: number;
}

export const DEFAULT_RULES: ScoringRules = {
  correct_team_score: 2, // 2 poäng per lag man gissat rätt antal mål på
  correct_outcome: 3,    // 3 poäng för rätt vinnare (eller oavgjort)
  correct_team_guess: 0, // Separerat: Poäng för rätt lag ges nu enbart via Slutspelstips-brickorna
};

export function calculatePoints(
  prediction: Prediction, 
  result: MatchResult, 
  rules: ScoringRules = DEFAULT_RULES
): number {
  const pHome = prediction.predicted_home_score;
  const pAway = prediction.predicted_away_score;
  const rHome = result.final_home_score;
  const rAway = result.final_away_score;

  let points = 0;

  // 1. Poäng för rätt lag-gissning (Knockouts)
  // Om användaren har tippat lag, kolla om de matchar verkligheten
  if (prediction.predicted_home_team && (prediction.predicted_home_team === result.home_team || prediction.predicted_home_team === result.away_team)) {
    points += rules.correct_team_guess;
  }
  if (prediction.predicted_away_team && (prediction.predicted_away_team === result.home_team || prediction.predicted_away_team === result.away_team)) {
    points += rules.correct_team_guess;
  }

  // 2. Poäng för rätt antal mål per lag
  if (pHome === rHome) {
    points += rules.correct_team_score;
  }
  if (pAway === rAway) {
    points += rules.correct_team_score;
  }

  // 3. Poäng för rätt utfall (Vinst Hemmalag, Vinst Bortalag, eller Oavgjort)
  const pDiff = pHome - pAway;
  const rDiff = rHome - rAway;

  const predictedHomeWin = pDiff > 0;
  const actualHomeWin = rDiff > 0;
  
  const predictedAwayWin = pDiff < 0;
  const actualAwayWin = rDiff < 0;
  
  const predictedDraw = pDiff === 0;
  const actualDraw = rDiff === 0;

  if (
    (predictedHomeWin && actualHomeWin) || 
    (predictedAwayWin && actualAwayWin) || 
    (predictedDraw && actualDraw)
  ) {
    points += rules.correct_outcome;
  }

  return points;
}
