'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteGroup } from './actions'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteGroup(groupId)
    
    if (result && 'error' in result) {
      toast.error(result.error)
      setIsDeleting(false)
      setIsConfirming(false)
    }
    // If it succeeds, the server action redirects automatically
  }

  if (!isConfirming) {
    return (
      <button
        onClick={() => setIsConfirming(true)}
        className="w-full mt-10 flex items-center justify-center gap-2 px-6 py-4 rounded-[24px] text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-100 dark:border-red-900/30 transition-all active:scale-[0.98]"
      >
        <Trash2 className="w-4 h-4" />
        Radera grupp
      </button>
    )
  }

  return (
    <div className="mt-10 p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-[32px] space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="font-black text-red-900 dark:text-red-100 uppercase tracking-tight">Är du helt säker?</h3>
          <p className="text-sm text-red-700/80 dark:text-red-400/80 mt-1">
            Detta kommer permanent radera gruppen, alla dess tävlingar och medlemmar. Detta går inte att ångra.
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Ja, radera permanent'
          )}
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          disabled={isDeleting}
          className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-black py-3 rounded-2xl text-xs uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          Avbryt
        </button>
      </div>
    </div>
  )
}
