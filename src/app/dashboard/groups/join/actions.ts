'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function joinGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const joinCode = (formData.get('joinCode') as string).toUpperCase()

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id')
    .eq('join_code', joinCode)
    .single()

  if (groupError || !group) {
    return { error: 'Koden är ogiltig. Kontrollera att du skrivit rätt.' }
  }

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'participant',
      payment_status: 'pending'
    })

  if (memberError) {
    if (memberError.code === '23505') { // Unique violation, redan medlem
      return { success: true, redirect: `/dashboard/groups/${group.id}` }
    }
    return { error: 'Gick inte att gå med: ' + memberError.message }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true, redirect: `/dashboard/groups/${group.id}` }
}
