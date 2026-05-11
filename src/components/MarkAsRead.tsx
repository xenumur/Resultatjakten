'use client'

import { useEffect } from 'react'
import { markNotificationsAsRead } from '@/app/dashboard/notifications/actions'

export function MarkAsRead() {
  useEffect(() => {
    markNotificationsAsRead()
  }, [])

  return null
}
