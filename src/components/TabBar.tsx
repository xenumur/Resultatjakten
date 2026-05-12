'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Clock, CheckCircle2 } from 'lucide-react'

interface TabBarProps {
  activeTab: 'upcoming' | 'played'
  upcomingCount: number
  playedCount: number
}

export function TabBar({ activeTab, upcomingCount, playedCount }: TabBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setTab = (tab: 'upcoming' | 'played') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const tabs = [
    { key: 'upcoming' as const, label: 'Kommande', icon: <Clock className="w-4 h-4" />, count: upcomingCount },
    { key: 'played' as const, label: 'Spelade', icon: <CheckCircle2 className="w-4 h-4" />, count: playedCount },
  ]

  return (
    <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-2xl w-fit">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => setTab(tab.key)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === tab.key
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          {tab.icon}
          {tab.label}
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
            activeTab === tab.key
              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
          }`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  )
}
