'use client'

import { useEffect } from 'react'
import { markNotificationsAsRead } from '@/app/dashboard/notifications/actions'

export function MarkAsRead() {
  useEffect(() => {
    markNotificationsAsRead()
    
    // Clear app badge if supported
    if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge().catch((err: any) => console.error('Error clearing badge:', err))
    }
  }, [])

  return null
}
