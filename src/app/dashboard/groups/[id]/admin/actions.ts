'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

export async function deleteGroup(groupId: string) {
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
    return { error: 'Endast administratörer kan radera gruppen.' }
  }

  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)

  if (error) return { error: 'Kunde inte radera gruppen: ' + error.message }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function removeMember(groupId: string, targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Inte inloggad' }

  // Verify current user is admin of the group
  const { data: adminMember } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!adminMember || adminMember.role !== 'admin') {
    return { error: 'Endast administratörer kan ta bort medlemmar.' }
  }

  // Prevent admin from removing themselves (they should use another way or delete group)
  if (user.id === targetUserId) {
    return { error: 'Du kan inte ta bort dig själv från gruppen här.' }
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', targetUserId)

  if (error) return { error: 'Kunde inte ta bort medlemmen: ' + error.message }

  revalidatePath(`/dashboard/groups/${groupId}/admin`)
  revalidatePath(`/dashboard/groups/${groupId}`)
  return { success: true }
}

export async function addDeadline(groupId: string, formData: FormData) {
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
    return { error: 'Endast administratörer kan lägga till deadlines.' }
  }

  const title = formData.get('title') as string
  const deadlineAt = formData.get('deadline_at') as string

  if (!title || !deadlineAt) {
    return { error: 'Titel och datum krävs.' }
  }

  const { error } = await supabase
    .from('group_deadlines')
    .insert({
      group_id: groupId,
      title: title.trim(),
      deadline_at: new Date(deadlineAt).toISOString()
    })

  if (error) return { error: 'Kunde inte spara deadline: ' + error.message }

  revalidatePath(`/dashboard/groups/${groupId}`)
  revalidatePath(`/dashboard/groups/${groupId}/admin`)
  return { success: true }
}

export async function deleteDeadline(groupId: string, deadlineId: string) {
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
    return { error: 'Endast administratörer kan ta bort deadlines.' }
  }

  const { error } = await supabase
    .from('group_deadlines')
    .delete()
    .eq('id', deadlineId)
    .eq('group_id', groupId)

  if (error) return { error: 'Kunde inte ta bort deadline: ' + error.message }

  revalidatePath(`/dashboard/groups/${groupId}`)
  revalidatePath(`/dashboard/groups/${groupId}/admin`)
  return { success: true }
}

export async function updateDeadline(groupId: string, deadlineId: string, formData: FormData) {
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
    return { error: 'Endast administratörer kan ändra deadlines.' }
  }

  const title = formData.get('title') as string
  const deadlineAt = formData.get('deadline_at') as string

  if (!title || !deadlineAt) {
    return { error: 'Titel och datum krävs.' }
  }

  const { error } = await supabase
    .from('group_deadlines')
    .update({
      title: title.trim(),
      deadline_at: new Date(deadlineAt).toISOString()
    })
    .eq('id', deadlineId)
    .eq('group_id', groupId)

  if (error) return { error: 'Kunde inte uppdatera deadline: ' + error.message }

  revalidatePath(`/dashboard/groups/${groupId}`)
  revalidatePath(`/dashboard/groups/${groupId}/admin`)
  return { success: true }
}
