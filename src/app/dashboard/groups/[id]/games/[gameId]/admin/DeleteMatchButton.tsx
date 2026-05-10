'use client'

import { Trash2 } from 'lucide-react'

export function DeleteMatchButton() {
  return (
    <button 
      title="Radera matchen" 
      type="submit" 
      className="text-sm bg-red-50 hover:bg-red-100 text-red-600 dark:bg-zinc-800 dark:hover:bg-red-900/40 dark:text-red-400 p-2.5 rounded-lg transition" 
      onClick={(e) => { 
        if(!window.confirm('Är du säker på att du vill radera denna match? Alla anslutna tips raderas också.')) {
          e.preventDefault() 
        }
      }}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
