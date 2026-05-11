'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendNotification(groupId: string, title: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Ej inloggad' }

  const { error } = await supabase
    .from('notifications')
    .insert({
      group_id: groupId,
      sender_id: user.id,
      title,
      content
    })

  if (error) {
    return { error: 'Kunde inte skicka notis: ' + error.message }
  }

  revalidatePath(`/dashboard/groups/${groupId}`)
  return { success: true, message: 'Notis skickad!' }
}

export async function getNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from('notifications')
    .select('*, profiles(display_name), groups(name)')
    .order('created_at', { ascending: false })

  return data || []
}
