'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

export async function createGroup(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const entryFee = parseInt((formData.get('entryFee') as string) || '0', 10)
  
  const joinCode = randomBytes(3).toString('hex').toUpperCase()

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name,
      description,
      entry_fee: entryFee,
      currency: 'SEK',
      join_code: joinCode,
      created_by: user.id
    })
    .select('id')
    .single()

  if (groupError) {
    return { error: 'Kunde inte skapa gruppen. ' + groupError.message }
  }

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin',
      payment_status: 'waived'
    })

  if (memberError) {
    return { error: 'Gruppen skapades, men du kunde inte läggas till som medlem.' }
  }

  revalidatePath('/dashboard', 'layout')
  redirect(`/dashboard/groups/${group.id}`)
}
