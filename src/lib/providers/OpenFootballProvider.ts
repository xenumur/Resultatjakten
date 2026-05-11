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

        // Mappning av SVT-matcher (översatt till engelska för att matcha API-datan)
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
        
        // Default för VM 2026 är TV4 (eftersom de visar majoriteten av matcherna)
        broadcaster = 'TV4';

        // Om matchen finns i SVT-listan, ändra till SVT
        const isSvt = svtMatchesEn.some(([sh, sa]) => {
          const nsh = normalize(sh);
          const nsa = normalize(sa);
          // Kolla båda håll utifall API:et vänder på hemma/borta
          return (nsh === normH && nsa === normA) || (nsh === normA && nsa === normH);
        });

        if (isSvt) {
          broadcaster = 'SVT';
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
