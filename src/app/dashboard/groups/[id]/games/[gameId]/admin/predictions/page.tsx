import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PredictionsOverviewClient } from './PredictionsOverviewClient'

export default async function AdminPredictionsPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const resolvedParams = await params;
  const { id: groupId, gameId } = resolvedParams;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Kolla om användaren är admin
  const { data: groupMember } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (groupMember?.role !== 'admin') {
    redirect(`/dashboard/groups/${groupId}/games/${gameId}`)
  }

  // Hämta spelet
  const { data: game } = await supabase
    .from('games')
    .select('name')
    .eq('id', gameId)
    .single()

  if (!game) return <div className="p-12 text-center text-red-500">Spelet hittades inte</div>

  // Hämta alla gruppmedlemmar
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, role, profiles:user_id(display_name, email)')
    .eq('group_id', groupId)

  const formattedMembers = (members || []).map((m: any) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return {
      user_id: m.user_id,
      role: m.role,
      profiles: profile ? {
        display_name: profile.display_name,
        email: profile.email
      } : null
    }
  })

  // Hämta alla matcher i detta spel
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, kickoff_time, stage, group_name, status')
    .eq('game_id', gameId)
    .order('kickoff_time', { ascending: true })

  // Hämta ALLA tippningar för detta spel
  const { data: predictions } = await supabase
    .from('predictions')
    .select('user_id, match_id, predicted_home_score, predicted_away_score')
    .eq('game_id', gameId)

  // Hämta ALLA slutspelstippningar för detta spel
  const { data: knockoutPredictions } = await supabase
    .from('knockout_predictions')
    .select('user_id, round, team_name')
    .eq('game_id', gameId)

  return (
    <PredictionsOverviewClient
      groupId={groupId}
      gameId={gameId}
      gameName={game.name}
      members={formattedMembers}
      matches={matches || []}
      predictions={predictions || []}
      knockoutPredictions={knockoutPredictions || []}
    />
  )
}
