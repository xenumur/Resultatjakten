export interface GoalData {
  player_name: string;
  team_name: string;
  minute: number;
  offset_minute?: number;
  is_penalty?: boolean;
  is_own_goal?: boolean;
}

export interface MatchData {
  external_match_id: string;
  home_team: string;
  away_team: string;
  kickoff_time: string; // ISO 8601
  stage?: string;
  group_name?: string;
  venue?: string;
  status: 'upcoming' | 'live' | 'finished';
  final_home_score?: number;
  final_away_score?: number;
  ot_home_score?: number;
  ot_away_score?: number;
  penalty_home_score?: number;
  penalty_away_score?: number;
  api_match_num?: number;
  broadcaster?: string;
  goals?: GoalData[];
}

export interface TournamentProvider {
  getProviderId(): string;
  getTournamentName(tournamentId: string): Promise<string>;
  fetchMatches(tournamentId: string): Promise<MatchData[]>;
}
