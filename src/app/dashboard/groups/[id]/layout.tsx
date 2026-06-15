import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SaveLastGroup } from '@/components/SaveLastGroup'

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

  return (
    <>
      <SaveLastGroup groupId={groupId} />
      {children}
    </>
  )
}
