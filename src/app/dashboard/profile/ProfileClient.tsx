'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor, Check, Mail, Shield } from 'lucide-react'
import { updateThemePreference } from './actions'
import { toast } from 'sonner'
import { NotificationToggle } from '@/components/PushNotificationManager'

export default function ProfileClient({ profile, userEmail }: { profile: any, userEmail: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const themes = [
    { id: 'light', name: 'Ljust tema', icon: Sun },
    { id: 'dark', name: 'Mörkt tema', icon: Moon },
    { id: 'system', name: 'Enligt systemet', icon: Monitor },
  ]

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme)
    try {
      await updateThemePreference(newTheme)
      toast.success('Temat har sparats')
    } catch (error) {
      console.error('Failed to save theme preference:', error)
      // We don't toast error here because it's still applied locally via setTheme
    }
  }

  if (!mounted) {
    return <div className="p-8 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-[32px] h-64" />
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Min Profil</h1>
        <p className="text-zinc-500 font-medium">Hantera dina personliga inställningar och appens utseende.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Profile Info Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/20">
              {profile?.display_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-none">{profile?.display_name}</h2>
              <p className="text-zinc-400 font-bold text-sm uppercase tracking-widest mt-1">Deltagare</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                <Mail className="w-5 h-5 text-zinc-400 group-hover:text-indigo-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">E-post</p>
                <p className="font-bold text-zinc-700 dark:text-zinc-300 truncate">{userEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                <Shield className="w-5 h-5 text-zinc-400 group-hover:text-indigo-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Roll</p>
                <p className="font-bold text-zinc-700 dark:text-zinc-300">Medlem</p>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 shadow-sm">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-6">Appens Utseende</h2>
          
          <div className="grid gap-3">
            {themes.map((t) => {
              const Icon = t.icon
              const isActive = theme === t.id
              
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all duration-300 group ${
                    isActive 
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' 
                      : 'border-transparent bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-colors ${
                      isActive ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-400 group-hover:text-zinc-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`font-black uppercase tracking-tight ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'
                    }`}>
                      {t.name}
                    </span>
                  </div>
                  {isActive && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <p className="text-xs font-bold text-zinc-500">
              Just nu används: <span className="text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{resolvedTheme === 'dark' ? 'Mörkt tema' : 'Ljust tema'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Notifications Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] p-8 shadow-sm">
        <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-6">Notiser</h2>
        <NotificationToggle />
      </div>
    </div>
  )
}
