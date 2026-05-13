import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')

  if (!groupId) return NextResponse.json({ error: 'Missing groupId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Hämta alla användare i gruppen (använd admin för att se alla medlemmar och prenumerationer)
  const adminSupabase = createAdminClient()
  const { data: members } = await adminSupabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)

  if (!members) return NextResponse.json({ count: 0 })

  const userIds = members.map(m => m.user_id)

  // Räkna unika prenumerationer för dessa användare
  const { count } = await adminSupabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
    .in('user_id', userIds)

  return NextResponse.json({ count: count || 0 })
}
