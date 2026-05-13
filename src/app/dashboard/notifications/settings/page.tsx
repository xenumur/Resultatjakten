import { NotificationToggle } from '@/components/PushNotificationManager'
import { ChevronLeft, Settings } from 'lucide-react'
import Link from 'next/link'

export default function NotificationSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-12">
      <div className="flex flex-col gap-6">
        <Link 
          href="/dashboard/notifications"
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Tillbaka till inkorgen
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-zinc-100 dark:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400 rounded-2xl">
            <Settings className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white">Inställningar</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Hantera dina notiser och inkorg</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Push-notiser</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Aktivera push-notiser för att få uppdateringar i realtid om händelser i dina grupper, även när du inte använder appen.
          </p>
          <NotificationToggle />
        </section>


        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Om Inkorgen</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            I inkorgen samlas alla meddelanden och uppdateringar från dina gruppadministratörer. 
            Du kan rensa din inkorg när som helst genom att klicka på rensa-knappen i översikten. 
            Detta döljer gamla notiser för dig personligen utan att påverka andra medlemmar i gruppen.
          </p>
        </section>
      </div>
    </div>
  )
}
