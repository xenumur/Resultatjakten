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

  const { data: groupId, error } = await supabase.rpc('join_group_by_code', {
    code_param: joinCode
  })

  if (error || !groupId) {
    if (error?.message === 'Invalid join code') {
      return { error: 'Koden är ogiltig. Kontrollera att du skrivit rätt.' }
    }
    return { error: 'Gick inte att gå med: ' + error?.message }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true, redirect: `/dashboard/groups/${groupId}` }
}
