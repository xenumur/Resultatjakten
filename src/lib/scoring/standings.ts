export interface TeamStanding {
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
}

export interface GroupStanding {
  groupName: string
  standings: TeamStanding[]
}

/**
 * Calculates standings for a group based on matches.
 * Note: This implements FIFA tie-breakers:
 * 1. Points
 * 2. Total GD
 * 3. Total GF
 * 4. Head-to-head points
 * 5. Head-to-head GD
 * 6. Head-to-head GF
 * (Simplified for MVP: 1. Pts, 2. GD, 3. GF, 4. H2H Pts)
 */
export function calculateStandings(matches: any[]): GroupStanding[] {
  const groups: Record<string, Record<string, TeamStanding>> = {}

  // Filter only group matches and ensure they are finished
  const finishedGroupMatches = matches.filter(m => m.group_name && m.status === 'finished')

  for (const match of matches) {
    if (!match.group_name) continue

    const gName = match.group_name
    if (!groups[gName]) groups[gName] = {}

    const initTeam = (name: string) => {
      if (!groups[gName][name]) {
        groups[gName][name] = { team: name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
      }
    }

    initTeam(match.home_team)
    initTeam(match.away_team)

    if (match.status === 'finished' && match.final_home_score !== null && match.final_away_score !== null) {
      const h = match.final_home_score
      const a = match.final_away_score

      const hTeam = groups[gName][match.home_team]
      const aTeam = groups[gName][match.away_team]

      hTeam.played++
      aTeam.played++
      hTeam.gf += h
      hTeam.ga += a
      aTeam.gf += a
      aTeam.ga += h
      hTeam.gd = hTeam.gf - hTeam.ga
      aTeam.gd = aTeam.gf - aTeam.ga

      if (h > a) {
        hTeam.won++
        hTeam.pts += 3
        aTeam.lost++
      } else if (a > h) {
        aTeam.won++
        aTeam.pts += 3
        hTeam.lost++
      } else {
        hTeam.drawn++
        aTeam.drawn++
        hTeam.pts += 1
        aTeam.pts += 1
      }
    }
  }

  return Object.entries(groups).map(([groupName, teamsObj]) => {
    const teams = Object.values(teamsObj)

    // Sort with tie-breakers
    teams.sort((a, b) => {
      // 1. Points
      if (b.pts !== a.pts) return b.pts - a.pts
      // 2. Total GD
      if (b.gd !== a.gd) return b.gd - a.gd
      // 3. Total GF
      if (b.gf !== a.gf) return b.gf - a.gf
      
      // 4. Head-to-head (Simplification: find matches between them)
      const h2hMatches = finishedGroupMatches.filter(m => 
        (m.home_team === a.team && m.away_team === b.team) ||
        (m.home_team === b.team && m.away_team === a.team)
      )
      
      if (h2hMatches.length > 0) {
        let aH2H = 0
        let bH2H = 0
        for (const m of h2hMatches) {
          if (m.final_home_score === m.final_away_score) {
            aH2H += 1; bH2H += 1
          } else if (m.home_team === a.team) {
            if (m.final_home_score > m.final_away_score) aH2H += 3; else bH2H += 3
          } else {
            if (m.final_away_score > m.final_home_score) aH2H += 3; else bH2H += 3
          }
        }
        if (bH2H !== aH2H) return bH2H - aH2H
      }

      // 5. Alphabetical fallback
      return a.team.localeCompare(b.team)
    })

    return { groupName, standings: teams }
  }).sort((a, b) => a.groupName.localeCompare(b.groupName))
}
