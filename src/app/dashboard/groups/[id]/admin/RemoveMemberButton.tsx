'use client'

import { useState } from 'react'
import { UserMinus, Loader2, AlertTriangle, X } from 'lucide-react'
import { removeMember } from './actions'

interface RemoveMemberButtonProps {
  groupId: string
  userId: string
  userName: string
}

export function RemoveMemberButton({ groupId, userId, userName }: RemoveMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = async () => {
    setIsRemoving(true)
    const result = await removeMember(groupId, userId)
    if (result?.error) {
      alert(result.error)
      setIsRemoving(false)
      setIsOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all group"
        title={`Ta bort ${userName}`}
      >
        <UserMinus className="w-5 h-5 transition-transform group-hover:scale-110" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white text-center mb-2 uppercase tracking-tight">
                Ta bort medlem?
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-center mb-8">
                Är du säker på att du vill ta bort <span className="font-bold text-zinc-900 dark:text-white">{userName}</span> från gruppen? Detta kan inte ångras.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg shadow-red-600/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isRemoving ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserMinus className="w-5 h-5" />}
                  Ja, ta bort medlem
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isRemoving}
                  className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition active:scale-95"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
