'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProvider } from '@/lib/providers'

export async function createGame(groupId: string, prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return { error: 'Endast administratörer kan skapa spel i denna grupp.' }
  }

  const name = formData.get('name') as string
  const tournamentId = formData.get('tournamentId') as string
  const providerId = formData.get('providerId') as string

  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      group_id: groupId,
      name,
      tournament_type: tournamentId,
      status: 'upcoming'
    })
    .select('id')
    .single()

  if (gameError) {
    return { error: 'Kunde inte skapa spelet.' }
  }

  try {
    const provider = getProvider(providerId)
    const matches = await provider.fetchMatches(tournamentId)

    if (matches.length > 0) {
      const dbMatches = matches.map(m => ({
        game_id: game.id,
        external_match_id: m.external_match_id,
        home_team: m.home_team,
        away_team: m.away_team,
        kickoff_time: m.kickoff_time,
        stage: m.stage,
        group_name: m.group_name,
        venue: m.venue,
        status: m.status,
        source_provider: providerId,
        api_match_num: m.api_match_num,
        broadcaster: m.broadcaster
      }))

      const { error: matchesError } = await supabase
        .from('matches')
        .insert(dbMatches)

      if (matchesError) {
        console.error('Kunde inte importera matcher:', matchesError)
        return { error: 'Matcher kunde inte infogas i databasen: ' + matchesError.message }
      }
    } else {
       return { error: 'Inga matcher hittades i valt API för denna turnering.' }
    }
  } catch (err: any) {
    console.error('Provider error:', err)
    
    // Fallback: radera det nyss skapade tomma spelet eftersom vi inte kunde ladda matcher
    await supabase.from('games').delete().eq('id', game.id);
    
    return { error: err.message || 'Ett okänt fel uppstod vid hämtning av matcher.' }
  }

  redirect(`/dashboard/groups/${groupId}/games/${game.id}`)
}
