'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePaymentStatus(groupId: string, userId: string, formData: FormData) {
  const supabase = await createClient()
  const status = formData.get('status') as string

  // TODO: Verifiera admin access i backend om tid finns. RLS bör redan hindra detta.
  await supabase
    .from('group_members')
    .update({ payment_status: status })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  revalidatePath(`/dashboard/groups/${groupId}/admin`)
  revalidatePath(`/dashboard/groups/${groupId}/members`)
}

export async function updateMemberRole(groupId: string, userId: string, role: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify current user is admin of the group
  const { data: currentUserMember } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (currentUserMember?.role !== 'admin') {
    throw new Error('Not authorized')
  }

  await supabase
    .from('group_members')
    .update({ role })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  revalidatePath(`/dashboard/groups/${groupId}/admin`)
  revalidatePath(`/dashboard/groups/${groupId}/members`)
  revalidatePath(`/dashboard/groups/${groupId}`)
}
