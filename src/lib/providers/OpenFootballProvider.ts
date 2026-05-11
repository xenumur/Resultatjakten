import { TournamentProvider, MatchData } from './TournamentProvider';

export class OpenFootballProvider implements TournamentProvider {
  getProviderId(): string {
    return 'open_football';
  }

  async getTournamentName(tournamentId: string): Promise<string> {
    if (tournamentId === 'wc-2026') return 'FIFA World Cup 2026';
    if (tournamentId === 'wc-2022') return 'FIFA World Cup 2022';
    return tournamentId;
  }

  async fetchMatches(tournamentId: string): Promise<MatchData[]> {
    // Vi hämtar datan direkt från master-branchen
    let url = '';
    
    if (tournamentId === 'wc-2026') {
      url = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
    } else if (tournamentId === 'wc-2022') {
      url = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2022/worldcup.json';
    } else {
      throw new Error("Turneringen stöds inte ännu av OpenFootballProvider");
    }

    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cachea 1 timme
    });

    if (!response.ok) {
      throw new Error(`Kunde inte hämta OpenFootball data: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.matches || data.matches.length === 0) {
      console.warn("Inga matcher hittades i JSON-filen");
      return [];
    }

    return data.matches.map((item: any, index: number) => {
      // Parsa t.ex. "20:00 UTC-6" till rätt ISO Offset
      let isoDate = new Date(item.date).toISOString(); // Fallback
      
      if (item.time) {
        const parts = item.time.split(' ');
        const timePart = parts[0]; // "20:00"
        const utcPart = parts[1]; // "UTC-6"
        
        let offset = '+00:00';
        if (utcPart && utcPart.startsWith('UTC')) {
          const hoursStr = utcPart.replace('UTC', '');
          if (hoursStr) {
            const hours = parseInt(hoursStr, 10);
            if (!isNaN(hours)) {
              const sign = hours < 0 ? '-' : '+';
              offset = `${sign}${Math.abs(hours).toString().padStart(2, '0')}:00`;
            }
          }
        }
        
        try {
          isoDate = new Date(`${item.date}T${timePart}:00${offset}`).toISOString();
        } catch (e) {
          console.error("Kunde inte parsa datum:", item.date, item.time);
        }
      }

      // Vissa JSON-filer har score, men framtida matcher har inte det.
      const homeScore = item.score1 ?? null;
      const awayScore = item.score2 ?? null;
      
      let status = 'upcoming';
      if (homeScore !== null && awayScore !== null) {
        status = 'finished' as const;
      }

      // Sändningsrättigheter för VM 2026 (baserat på SVT-data)
      let broadcaster = null;
      if (tournamentId === 'wc-2026') {
        const h = item.team1;
        const a = item.team2;
        
        // Exempel på mappning från artikeln
        const svtMatches = [
          'Kanada - Bosnien och Hercegovina',
          'Brasilien - Marocko',
          'Haiti - Skottland',
          'Sverige - Tunisien',
          'Spanien - Kap Verde',
          'Belgien - Egypten',
          'Frankrike - Senegal',
          'USA - Australien',
          'Skottland - Marocko',
          'Tunisien - Japan',
          'Argentina - Österrike',
          'Frankrike - Irak',
          'Norge - Senegal',
          'Portugal - Uzbekistan',
          'England - Ghana',
          'Sydafrika - Sydkorea',
          'Tjeckien - Mexiko',
          'Curacao - Elfenbenskusten',
          'Ecuador - Tyskland',
          'Tunisien - Nederländerna',
          'Japan - Sverige',
          'Panama - England',
          'Kroatien - Ghana'
        ];
        
        const matchKey = `${h} - ${a}`;
        if (svtMatches.includes(matchKey)) {
          broadcaster = 'SVT';
        } else {
          // De flesta andra är TV4 enligt artikeln ("TV4 visar fler matcher")
          // Vi sätter TV4 som default för de vi vet visas där, eller lämnar null om osäkert.
          const tv4Matches = [
             'Mexiko - Sydafrika', 'Sydkorea - Tjeckien', 'USA - Paraguay', 'Qatar - Schweiz', 
             'Australien - Turkiet', 'Tyskland - Curacao', 'Nederländerna - Japan', 
             'Elfbenskusten - Ecuador', 'Saudiarabien - Uruguay', 'Iran - Nya Zeeland',
             'Irak - Norge', 'Argentina - Algeriet', 'Österrike - Jordanien',
             'Portugal - DR Kongo', 'England - Kroatien', 'Ghana - Panama', 'Uzbekistan - Colombia',
             'Tjeckien - Sydafrika', 'Schweiz - Bosnien och Hercegovina', 'Kanada - Qatar', 'Mexiko - Sydkorea',
             'Brasilien - Haiti', 'Turkiet - Paraguay', 'Nederländerna - Sverige', 'Tyskland - Elfbenskusten',
             'Ecuador - Curaçao', 'Spanien - Saudiarabien', 'Belgien - Iran', 'Uruguay - Kap Verde', 'Nya Zeeland - Egypten',
             'Jordanien - Algeriet', 'Panama - Kroatien', 'Colombia - DR Kongo', 'Schweiz - Kanada', 'Bosnien och Hercegovina - Qatar',
             'Marocko - Haiti', 'Skottland - Brasilien', 'Turkiet - USA', 'Paraguay - Australien',
             'Norge - Frankrike', 'Senegal - Irak', 'Kap Verde - Saudiarabien', 'Uruguay - Spanien',
             'Nya Zeeland - Belgien', 'Egypten - Iran', 'Demokratiska republiken Kongo - Uzbekistan',
             'Colombia - Portugal', 'Algeriet - Österrike', 'Jordanien - Argentina'
          ];
          if (tv4Matches.includes(matchKey)) {
            broadcaster = 'TV4';
          }
        }
      }

      return {
        external_match_id: `of-${tournamentId}-${index}`,
        home_team: item.team1,
        away_team: item.team2,
        kickoff_time: isoDate,
        stage: item.round,
        group_name: item.group || null,
        venue: item.ground || '',
        status: status as 'upcoming' | 'live' | 'finished',
        final_home_score: homeScore,
        final_away_score: awayScore,
        api_match_num: item.num,
        broadcaster
      };
    });
  }
}
