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
    // I en riktig app skulle vi använda useFormState för att visa detta
    return;
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
      revalidatePath('/dashboard', 'layout')
      redirect(`/dashboard/groups/${group.id}`)
    }
    return;
  }

  revalidatePath('/dashboard', 'layout')
  redirect(`/dashboard/groups/${group.id}`)
}
