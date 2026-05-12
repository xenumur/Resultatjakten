'use client'

import { useState, useEffect } from 'react'
import { subscribeToPush } from '@/app/dashboard/notifications/actions'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// ─── Inline card for the Profile page ────────────────────────────────────────
export function NotificationToggle() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription().then(setSubscription)
      )
    }
  }, [])

  async function handleSubscribe() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      const result = await subscribeToPush(sub.toJSON())
      if (result.success) {
        setSubscription(sub)
        toast.success('Notiser aktiverade!')
      } else {
        toast.error('Kunde inte spara prenumeration')
      }
    } catch {
      toast.error('Kunde inte aktivera notiser. På iOS: lägg till appen på hemskärmen först.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnsubscribe() {
    if (!subscription) return
    setLoading(true)
    try {
      await subscription.unsubscribe()
      setSubscription(null)
      toast.success('Notiser avaktiverade')
    } catch {
      toast.error('Kunde inte avaktivera notiser')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return <div className="h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
  if (!isSupported) return (
    <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-sm font-bold text-center">
      Push-notiser stöds inte i din webbläsare
    </div>
  )

  const isIOS = /iPad|iPhone|iPod/.test(typeof navigator !== 'undefined' ? navigator.userAgent : '')
  const isActive = !!subscription

  return (
    <div className={`p-5 rounded-3xl border-2 transition-all ${
      isActive
        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700'
        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${
          isActive
            ? 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
        }`}>
          {isActive ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-black text-sm uppercase tracking-tight ${
            isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'
          }`}>
            {isActive ? 'Notiser aktiverade' : 'Push-notiser'}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isActive
              ? 'Du får notiser om matchstart och resultat.'
              : 'Få notiser om matchstart och resultat.'}
          </p>
          {!isActive && isIOS && (
            <p className="text-xs text-indigo-500 font-bold mt-1">
              iOS: Lägg till appen på hemskärmen för att aktivera.
            </p>
          )}
        </div>
        <button
          onClick={isActive ? handleUnsubscribe : handleSubscribe}
          disabled={loading}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all active:scale-95 disabled:opacity-50 ${
            isActive
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20'
          }`}
        >
          {loading ? '...' : isActive ? 'Avaktivera' : 'Aktivera'}
        </button>
      </div>
    </div>
  )
}
