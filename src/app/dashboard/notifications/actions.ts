'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import webpush from 'web-push'

// Konfigurera VAPID-nycklar (bör sättas i miljövariabler)
const vapidDetails = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: 'mailto:admin@resultatjakten.se'
}

if (vapidDetails.publicKey && vapidDetails.privateKey) {
  webpush.setVapidDetails(
    vapidDetails.subject,
    vapidDetails.publicKey,
    vapidDetails.privateKey
  )
}

export async function sendNotification(groupId: string, title: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Ej inloggad' }

  // 1. Spara i databasen för inkorgen
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

  // 2. Skicka Push-notiser till alla i gruppen
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)

  if (members) {
    const userIds = members.map(m => m.user_id)
    
    // Hämta alla push-prenumerationer för dessa användare
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)

    if (subscriptions) {
      const payload = JSON.stringify({
        title,
        body: content,
        url: `/dashboard/notifications`,
        badgeCount: 1
      })

      // Skicka push till alla prenumerationer (parallellt)
      Promise.all(subscriptions.map(sub => 
        webpush.sendNotification(sub.subscription as any, payload)
          .catch(err => {
            console.error('Push error:', err)
            if (err.statusCode === 410 || err.statusCode === 404) {
              // Prenumerationen är inte längre giltig, ta bort den
              return supabase.from('push_subscriptions').delete().eq('id', sub.id)
            }
          })
      ))
    }
  }

  revalidatePath(`/dashboard/groups/${groupId}`)
  return { success: true, message: 'Notis skickad till alla deltagare!' }
}

export async function subscribeToPush(subscription: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Ej inloggad' }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      subscription
    }, { onConflict: 'user_id, subscription' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      profiles:sender_id(display_name),
      groups:group_id(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return data || []
}

export async function getUnreadCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 0

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('last_read_notifications_at')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) return 0

  // Hämta grupper som användaren är med i
  const { data: memberGroups, error: memberError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  if (memberError || !memberGroups || memberGroups.length === 0) return 0
  const groupIds = memberGroups.map(mg => mg.group_id)

  const { count, error: countError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .in('group_id', groupIds)
    .gt('created_at', profile.last_read_notifications_at)

  if (countError) {
    console.error('Error counting unread notifications:', countError)
    return 0
  }

  return count || 0
}

export async function markNotificationsAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from('profiles')
    .update({ last_read_notifications_at: new Date().toISOString() })
    .eq('id', user.id)

  revalidatePath('/dashboard', 'layout')
}
