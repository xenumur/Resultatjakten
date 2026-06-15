'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface LastGroupRedirectorProps {
  validGroupIds: string[]
}

export function LastGroupRedirector({ validGroupIds }: LastGroupRedirectorProps) {
  const router = useRouter()

  useEffect(() => {
    // 1. Check if we have already performed the session-level redirect to the last group
    const hasRedirected = sessionStorage.getItem('redirected_to_last_group')
    if (hasRedirected === 'true') {
      return
    }

    // 2. Get the last visited group ID from localStorage
    const lastGroupId = localStorage.getItem('last_group_id')
    if (!lastGroupId) {
      return
    }

    // 3. Verify that the group ID is still valid (the user is still a member)
    if (validGroupIds.includes(lastGroupId)) {
      // Set the session flag so that subsequent navigations to /dashboard do not redirect
      sessionStorage.setItem('redirected_to_last_group', 'true')
      router.replace(`/dashboard/groups/${lastGroupId}`)
    } else {
      // Clean up localStorage if the group is no longer valid/accessible
      localStorage.removeItem('last_group_id')
    }
  }, [router, validGroupIds])

  return null
}
