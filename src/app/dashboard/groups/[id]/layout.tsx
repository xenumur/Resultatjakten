import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SaveLastGroup } from '@/components/SaveLastGroup'
import { GroupLiveSyncWatcher } from './GroupLiveSyncWatcher'

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const groupId = resolvedParams.id
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify membership
  const { data: member, error } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (error || !member) {
    // If not a member, check if the group exists at all
    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .single()

    if (!group) {
      redirect('/dashboard')
    }

    // If group exists but user is not a member, redirect to dashboard
    redirect('/dashboard')
  }

  // If the user is an admin, fetch games and matches for background auto-sync
  let adminMatches: any[] = []
  if (member.role === 'admin') {
    const { data: games } = await supabase
      .from('games')
      .select('id')
      .eq('group_id', groupId)

    const gameIds = (games || []).map(g => g.id)
    if (gameIds.length > 0) {
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          id,
          game_id,
          home_team,
          away_team,
          kickoff_time,
          status,
          disable_auto_sync,
          is_manual_override,
          provider_home_score,
          provider_away_score,
          final_home_score,
          final_away_score,
          provider_status,
          provider_home_team,
          provider_away_team
        `)
        .in('game_id', gameIds)

      adminMatches = matches || []
    }
  }

  return (
    <>
      <SaveLastGroup groupId={groupId} />
      {member.role === 'admin' && adminMatches.length > 0 && (
        <GroupLiveSyncWatcher matches={adminMatches} groupId={groupId} />
      )}
      {children}
    </>
  )
}

