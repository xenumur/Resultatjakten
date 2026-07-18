import { TournamentProvider, MatchData, GoalData } from './TournamentProvider';

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
      let homeScore = null;
      let awayScore = null;
      if (item.score && Array.isArray(item.score.ft) && item.score.ft.length >= 2) {
        homeScore = item.score.ft[0] !== undefined ? item.score.ft[0] : null;
        awayScore = item.score.ft[1] !== undefined ? item.score.ft[1] : null;
      } else {
        homeScore = item.score1 ?? null;
        awayScore = item.score2 ?? null;
      }

      let otHomeScore = null;
      let otAwayScore = null;
      if (item.score && Array.isArray(item.score.et) && item.score.et.length >= 2) {
        otHomeScore = item.score.et[0] !== undefined ? item.score.et[0] : null;
        otAwayScore = item.score.et[1] !== undefined ? item.score.et[1] : null;
      }

      let penaltyHomeScore = null;
      let penaltyAwayScore = null;
      if (item.score && Array.isArray(item.score.p) && item.score.p.length >= 2) {
        penaltyHomeScore = item.score.p[0] !== undefined ? item.score.p[0] : null;
        penaltyAwayScore = item.score.p[1] !== undefined ? item.score.p[1] : null;
      }
      
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

        // Fullständig och verifierad lista över SVT-matcher för VM 2026 (enligt SVT:s guide)
        const svtMatchesEn = [
          ['Canada', 'Bosnia & Herzegovina'], ['Canada', 'Bosnia and Herzegovina'],
          ['Brazil', 'Morocco'], ['Haiti', 'Scotland'],
          ['Sweden', 'Tunisia'], ['Spain', 'Cape Verde'],
          ['Belgium', 'Egypt'], ['France', 'Senegal'],
          ['USA', 'Australia'], ['Scotland', 'Morocco'],
          ['Tunisia', 'Japan'], ['Argentina', 'Austria'],
          ['France', 'Iraq'], ['Norway', 'Senegal'],
          ['Portugal', 'Uzbekistan'], ['England', 'Ghana'],
          ['South Africa', 'South Korea'], ['Czech Republic', 'Mexico'],
          ['Curaçao', 'Ivory Coast'], ['Curacao', 'Ivory Coast'],
          ['Ecuador', 'Germany'], ['Tunisia', 'Netherlands'],
          ['Japan', 'Sweden'], ['Panama', 'England'],
          ['Croatia', 'Ghana']
        ];
        
        // SVT Knockout-platshållare
        const svtKnockoutPlaceholders = [
          '1E – 3A/B/C/D/F', '1F – 2C', '1L – 3E/H/I/J/K', '1H – 2J',
          '1J – 2H', '1K – 3D/E/I/J/L', 'W74 – W77', 'W79 – W80',
          'W85 – W87', 'W93 – W94', 'W95 – W96', 'W97 – W98', 'L101 – L102'
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

        // Kolla även knockout-platshållare
        const isSvtKnockout = svtKnockoutPlaceholders.some(p => {
          const [ph, pa] = p.split(/[–-]/).map(s => normalize(s.trim()));
          return (ph === normH && pa === normA) || (ph === normA && pa === normH);
        });

        if (isSvt || isSvtKnockout) {
          broadcaster = 'SVT';
        }
      }

      // Mappa målskyttar
      const goals: GoalData[] = [];
      if (Array.isArray(item.goals1)) {
        for (const g of item.goals1) {
          let mainMinute = 0;
          let offsetMinute = undefined;
          
          if (g.minute !== undefined && g.minute !== null) {
            const minStr = String(g.minute);
            if (minStr.includes('+')) {
              const parts = minStr.split('+');
              mainMinute = parseInt(parts[0], 10) || 0;
              offsetMinute = parseInt(parts[1], 10) || undefined;
            } else {
              mainMinute = parseInt(minStr, 10) || 0;
            }
          }

          goals.push({
            player_name: g.name,
            team_name: g.owngoal ? item.team2 : item.team1, // Invertera lag om självmål!
            minute: mainMinute,
            offset_minute: offsetMinute || g.offset,
            is_penalty: !!g.penalty,
            is_own_goal: !!g.owngoal
          });
        }
      }
      if (Array.isArray(item.goals2)) {
        for (const g of item.goals2) {
          let mainMinute = 0;
          let offsetMinute = undefined;
          
          if (g.minute !== undefined && g.minute !== null) {
            const minStr = String(g.minute);
            if (minStr.includes('+')) {
              const parts = minStr.split('+');
              mainMinute = parseInt(parts[0], 10) || 0;
              offsetMinute = parseInt(parts[1], 10) || undefined;
            } else {
              mainMinute = parseInt(minStr, 10) || 0;
            }
          }

          goals.push({
            player_name: g.name,
            team_name: g.owngoal ? item.team1 : item.team2, // Invertera lag om självmål!
            minute: mainMinute,
            offset_minute: offsetMinute || g.offset,
            is_penalty: !!g.penalty,
            is_own_goal: !!g.owngoal
          });
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
        ot_home_score: otHomeScore,
        ot_away_score: otAwayScore,
        penalty_home_score: penaltyHomeScore,
        penalty_away_score: penaltyAwayScore,
        api_match_num: item.num,
        broadcaster,
        goals
      };
    });
  }
}
