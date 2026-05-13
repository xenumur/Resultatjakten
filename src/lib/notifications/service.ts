import { createAdminClient } from '@/lib/supabase/server'
import webpush from 'web-push'

// Configure VAPID keys
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

/**
 * Sends a notification to a specific user.
 * Includes both an in-app notification (database) and a push notification.
 */
export async function sendPersonalNotification({
  userId,
  groupId,
  title,
  content,
  url,
  senderId = null
}: {
  userId: string,
  groupId: string,
  title: string,
  content: string,
  url?: string,
  senderId?: string | null
}) {
  const adminSupabase = createAdminClient()

  // 1. Save in database for the inbox
  const { error: dbError } = await adminSupabase
    .from('notifications')
    .insert({
      group_id: groupId,
      sender_id: senderId,
      recipient_id: userId,
      title,
      content
    })

  if (dbError) {
    console.error('Error saving personal notification:', dbError)
    return { error: dbError.message }
  }

  // 2. Send Push notifications to this specific user
  const { data: subscriptions } = await adminSupabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (subscriptions && subscriptions.length > 0) {
    const payload = JSON.stringify({
      title,
      body: content,
      url: url || `/dashboard/groups/${groupId}`, // Link to the group page by default
      badgeCount: 1
    })

    // Send push to all subscriptions for this user
    await Promise.all(subscriptions.map(sub => 
      webpush.sendNotification(sub.subscription as any, payload)
        .catch(err => {
          console.error('Push error for user', userId, ':', err)
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription is no longer valid, remove it
            return adminSupabase.from('push_subscriptions').delete().eq('id', sub.id)
          }
        })
    ))
  }

  return { success: true }
}
