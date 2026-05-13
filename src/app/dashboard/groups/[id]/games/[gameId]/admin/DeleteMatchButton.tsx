'use client'

import { Trash2 } from 'lucide-react'
import { SubmitButton } from '@/components/ui/SubmitButton'

export function DeleteMatchButton() {
  return (
    <SubmitButton 
      title="Radera matchen" 
      type="submit" 
      className="flex items-center justify-center text-sm bg-red-50 hover:bg-red-500 hover:text-white text-red-600 dark:bg-zinc-800 dark:hover:bg-red-900/40 dark:text-red-400 p-2.5 rounded-xl transition-all active:scale-95" 
      loadingText=""
      onClick={(e) => { 
        if(!window.confirm('Är du säker på att du vill radera denna match? Alla anslutna tips raderas också.')) {
          e.preventDefault() 
        }
      }}
    >
      <Trash2 className="w-4 h-4" />
    </SubmitButton>
  )
}
