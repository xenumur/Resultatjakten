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
export async function updateGroupSettings(groupId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Inte inloggad' }

  // Verify admin
  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return { error: 'Endast administratörer kan ändra gruppinställningar.' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const entryFee = parseFloat(formData.get('entry_fee') as string)
  const currency = formData.get('currency') as string
  const paymentInfo = formData.get('payment_info') as string

  if (!name || name.trim().length < 2) {
    return { error: 'Namnet måste vara minst 2 tecken.' }
  }

  const { error } = await supabase
    .from('groups')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      entry_fee: isNaN(entryFee) ? 0 : entryFee,
      currency: currency?.trim() || 'SEK',
      payment_info: paymentInfo?.trim() || null
    })
    .eq('id', groupId)

  if (error) return { error: 'Kunde inte uppdatera: ' + error.message }

  revalidatePath(`/dashboard/groups/${groupId}`)
  revalidatePath(`/dashboard/groups/${groupId}/admin`)
  return { success: true, message: 'Gruppinställningarna har uppdaterats!' }
}
