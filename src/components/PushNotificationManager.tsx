'use client'

import { useState, useEffect } from 'react'
import { subscribeToPush } from '@/app/dashboard/notifications/actions'
import { Bell, BellOff, X } from 'lucide-react'
import { toast } from 'sonner'

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      checkSubscription()
    }
  }, [])

  async function checkSubscription() {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
    
    // Om vi inte har en prenumeration, visa prompt efter en liten fördröjning
    if (!sub && Notification.permission === 'default') {
      setTimeout(() => setShowPrompt(true), 2000)
    }
  }

  async function handleSubscribe() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      })

      const result = await subscribeToPush(sub.toJSON())
      if (result.success) {
        setSubscription(sub)
        setShowPrompt(false)
        toast.success('Notiser aktiverade!')
      } else {
        toast.error('Kunde inte spara prenumeration')
      }
    } catch (error) {
      console.error('Failed to subscribe:', error)
      toast.error('Kunde inte aktivera notiser. Se till att du har lagt till appen på hemskärmen (iOS).')
    }
  }

  if (!isSupported) return null

  if (showPrompt) {
    return (
      <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[100] animate-in slide-in-from-bottom-10 duration-500">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] shadow-2xl max-w-sm relative">
          <button 
            onClick={() => setShowPrompt(false)}
            className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white">Missa inget!</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Få notiser om matchstart och resultat direkt i mobilen.</p>
            </div>
          </div>
          
          <button 
            onClick={handleSubscribe}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            Aktivera Notiser
          </button>
        </div>
      </div>
    )
  }

  return (
    <button 
      onClick={() => {
        if (!subscription) handleSubscribe()
        else toast.info('Notiser är redan aktiverade')
      }}
      className={`fixed bottom-20 right-4 md:bottom-8 md:right-8 p-4 rounded-full shadow-lg transition-all active:scale-90 z-40 ${
        subscription 
          ? 'bg-emerald-500 text-white' 
          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
      }`}
      title={subscription ? 'Notiser aktiverade' : 'Aktivera notiser'}
    >
      {subscription ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
    </button>
  )
}

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
