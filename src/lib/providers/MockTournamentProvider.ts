import { MatchData, TournamentProvider } from './TournamentProvider';
import { addDays } from 'date-fns';

export class MockTournamentProvider implements TournamentProvider {
  getProviderId(): string {
    return 'mock';
  }

  async getTournamentName(tournamentId: string): Promise<string> {
    if (tournamentId === 'wc-2026') return 'Fotbolls-VM 2026';
    if (tournamentId === 'euro-2028') return 'EM 2028';
    return 'Okänd Turnering';
  }

  async fetchMatches(tournamentId: string): Promise<MatchData[]> {
    const today = new Date();
    
    return [
      {
        external_match_id: `${tournamentId}-match-1`,
        home_team: 'Sverige',
        away_team: 'Brasilien',
        kickoff_time: addDays(today, 2).toISOString(),
        stage: 'Gruppspel',
        group_name: 'Grupp A',
        venue: 'Azteca Stadium',
        status: 'upcoming',
      },
      {
        external_match_id: `${tournamentId}-match-2`,
        home_team: 'Argentina',
        away_team: 'Frankrike',
        kickoff_time: addDays(today, 3).toISOString(),
        stage: 'Gruppspel',
        group_name: 'Grupp A',
        venue: 'MetLife Stadium',
        status: 'upcoming',
      },
      {
        external_match_id: `${tournamentId}-match-3`,
        home_team: 'Spanien',
        away_team: 'Tyskland',
        kickoff_time: addDays(today, 4).toISOString(),
        stage: 'Gruppspel',
        group_name: 'Grupp B',
        venue: 'SoFi Stadium',
        status: 'upcoming',
      }
    ];
  }
}
