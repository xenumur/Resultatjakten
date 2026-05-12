'use client'

import { useState } from 'react'
import { UserMinus, Loader2, AlertCircle } from 'lucide-react'
import { removeMember } from './actions'

interface RemoveMemberButtonProps {
  groupId: string
  userId: string
  userName: string
}

export function RemoveMemberButton({ groupId, userId, userName }: RemoveMemberButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = async () => {
    setIsRemoving(true)
    const result = await removeMember(groupId, userId)
    if (result?.error) {
      alert(result.error)
      setIsRemoving(false)
      setIsConfirming(false)
    }
  }

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest hidden sm:block">Är du säker?</p>
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition active:scale-95 disabled:opacity-50"
        >
          {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          disabled={isRemoving}
          className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition active:scale-95"
        >
          Avbryt
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition group"
      title={`Ta bort ${userName}`}
    >
      <UserMinus className="w-5 h-5 transition-transform group-hover:scale-110" />
    </button>
  )
}
