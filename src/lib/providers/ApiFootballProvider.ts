import { TournamentProvider, MatchData } from './TournamentProvider';

export class ApiFootballProvider implements TournamentProvider {
  id = 'api_football';
  name = 'API-Football (Live)';

  private apiKey: string;
  private apiHost = 'v3.football.api-sports.io';

  constructor() {
    // I Next.js måste detta sättas i .env.local
    this.apiKey = process.env.API_FOOTBALL_KEY || '';
  }

  async fetchMatches(tournamentId: string): Promise<MatchData[]> {
    if (!this.apiKey) {
      throw new Error("API_FOOTBALL_KEY is not set in environment variables");
    }

    let leagueId = '1';
    let season = '2026';
    
    if (tournamentId === 'wc-2026') {
      leagueId = '1'; 
      season = '2026';
    } else if (tournamentId === 'wc-2022') {
      leagueId = '1';
      season = '2022';
    } else if (tournamentId === 'euro-2028') {
      leagueId = '4';
      season = '2028';
    }

    const response = await fetch(`https://${this.apiHost}/fixtures?league=${leagueId}&season=${season}`, {
      headers: {
        'x-apisports-key': this.apiKey,
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Kunde inte hämta matcher från API-Football: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors && data.errors.plan) {
      throw new Error(`API-Football fel: ${data.errors.plan}`);
    }

    if (!data.response || data.response.length === 0) {
      console.warn(`Inga matcher hittades för league ${leagueId} season ${season}`);
      return [];
    }

    return data.response.map((item: any) => {
      let status = 'upcoming';
      const statusCode = item.fixture.status.short;
      
      if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT'].includes(statusCode)) {
        status = 'live';
      } else if (['FT', 'AET', 'PEN'].includes(statusCode)) {
        status = 'finished';
      }

      return {
        external_id: item.fixture.id.toString(),
        home_team: item.teams.home.name,
        away_team: item.teams.away.name,
        kickoff_time: item.fixture.date,
        stage: item.league.round,
        venue: item.fixture.venue?.name || '',
        status: status,
        final_home_score: item.goals.home,
        final_away_score: item.goals.away,
      } as MatchData;
    });
  }
}
