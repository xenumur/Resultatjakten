'use client'

import { useEffect } from 'react'

interface SaveLastGroupProps {
  groupId: string
}

export function SaveLastGroup({ groupId }: SaveLastGroupProps) {
  useEffect(() => {
    if (groupId) {
      localStorage.setItem('last_group_id', groupId)
    }
  }, [groupId])

  return null
}
