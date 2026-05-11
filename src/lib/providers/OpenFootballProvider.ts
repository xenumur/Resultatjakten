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
        
        // Normalisera namn för jämförelse (ta bort accenter, små bokstäver)
        const normalize = (name: string) => {
          if (!name) return '';
          return name.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Ta bort accenter (t.ex. ç -> c)
            .replace(/[^a-z0-9]/g, '');    // Ta bort specialtecken och mellanslag
        };

        // Mappning från SVT (översatt till engelska för att matcha API-datan)
        const svtMatchesEn = [
          ['Canada', 'Bosnia and Herzegovina'],
          ['Brazil', 'Morocco'],
          ['Haiti', 'Scotland'],
          ['Sweden', 'Tunisia'],
          ['Spain', 'Cape Verde'],
          ['Belgium', 'Egypt'],
          ['France', 'Senegal'],
          ['USA', 'Australia'],
          ['United States', 'Australia'],
          ['Scotland', 'Morocco'],
          ['Tunisia', 'Japan'],
          ['Argentina', 'Austria'],
          ['France', 'Iraq'],
          ['Norway', 'Senegal'],
          ['Portugal', 'Uzbekistan'],
          ['England', 'Ghana'],
          ['South Africa', 'South Korea'],
          ['Czech Republic', 'Mexico'],
          ['Curacao', 'Ivory Coast'],
          ['Curacao', 'Cote d\'Ivoire'],
          ['Ecuador', 'Germany'],
          ['Tunisia', 'Netherlands'],
          ['Japan', 'Sweden'],
          ['Panama', 'England'],
          ['Croatia', 'Ghana']
        ];
        
        const normH = normalize(h);
        const normA = normalize(a);
        
        const isSvt = svtMatchesEn.some(([sh, sa]) => 
          normalize(sh) === normH && normalize(sa) === normA
        );

        if (isSvt) {
          broadcaster = 'SVT';
        } else {
          // De flesta andra är TV4 enligt SVT-artikeln
          const tv4MatchesEn = [
             ['Mexico', 'South Africa'], ['South Korea', 'Czech Republic'], ['USA', 'Paraguay'], ['United States', 'Paraguay'],
             ['Qatar', 'Switzerland'], ['Australia', 'Turkey'], ['Germany', 'Curacao'], ['Netherlands', 'Japan'], 
             ['Ivory Coast', 'Ecurador'], ['Cote d\'Ivoire', 'Ecuador'], ['Saudi Arabia', 'Uruguay'], ['Iran', 'New Zealand'],
             ['Iraq', 'Norway'], ['Argentina', 'Algeria'], ['Austria', 'Jordan'],
             ['Portugal', 'DR Congo'], ['England', 'Croatia'], ['Ghana', 'Panama'], ['Uzbekistan', 'Colombia'],
             ['Czech Republic', 'South Africa'], ['Switzerland', 'Bosnia and Herzegovina'], ['Canada', 'Qatar'], ['Mexico', 'South Korea'],
             ['Brazil', 'Haiti'], ['Turkey', 'Paraguay'], ['Netherlands', 'Sweden'], ['Germany', 'Ivory Coast'], ['Germany', 'Cote d\'Ivoire'],
             ['Ecuador', 'Curacao'], ['Spain', 'Saudi Arabia'], ['Belgium', 'Iran'], ['Uruguay', 'Cape Verde'], ['New Zealand', 'Egypt'],
             ['Jordan', 'Algeria'], ['Panama', 'Croatia'], ['Colombia', 'DR Congo'], ['Switzerland', 'Canada'], ['Bosnia and Herzegovina', 'Qatar'],
             ['Morocco', 'Haiti'], ['Scotland', 'Brazil'], ['Turkey', 'USA'], ['Turkey', 'United States'], ['Paraguay', 'Australia'],
             ['Norway', 'France'], ['Senegal', 'Iraq'], ['Cape Verde', 'Saudi Arabia'], ['Uruguay', 'Spain'],
             ['New Zealand', 'Belgium'], ['Egypt', 'Iran'], ['DR Congo', 'Uzbekistan'],
             ['Colombia', 'Portugal'], ['Algeria', 'Austria'], ['Jordan', 'Argentina']
          ];
          
          const isTv4 = tv4MatchesEn.some(([th, ta]) => 
            normalize(th) === normH && normalize(ta) === normA
          );

          if (isTv4) {
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
