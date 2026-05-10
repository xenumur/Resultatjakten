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
}

export interface TournamentProvider {
  getProviderId(): string;
  getTournamentName(tournamentId: string): Promise<string>;
  fetchMatches(tournamentId: string): Promise<MatchData[]>;
}
