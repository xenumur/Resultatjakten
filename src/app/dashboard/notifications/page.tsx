import { Bell, Calendar, ChevronRight, Settings } from 'lucide-react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import Link from 'next/link'
import { MarkAsRead } from '@/components/MarkAsRead'
import { ClearNotificationsButton } from '@/components/ClearNotificationsButton'

import { getNotifications } from './actions'

export default async function NotificationsPage() {
  const notifications = await getNotifications()
  
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-12">
      <MarkAsRead />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Bell className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white">Inkorg</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Notiser från dina gruppadministratörer</p>
          </div>
        </div>
        
        <div className="w-full md:w-auto flex items-center gap-3">
          <Link
            href="/dashboard/notifications/settings"
            className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 rounded-xl transition-all duration-200"
            title="Inställningar"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <ClearNotificationsButton hasNotifications={notifications.length > 0} />
        </div>
      </div>

      <div className="space-y-6">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <Bell className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 font-bold">Inga notiser än.</p>
          </div>
        ) : (
          notifications.map((notif: any) => (
            <div 
              key={notif.id} 
              className="group relative bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-100 dark:border-indigo-900/30">
                      {notif.groups?.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(notif.created_at), 'd MMM HH:mm', { locale: sv })}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {notif.title}
                  </h3>
                </div>
                <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800">
                  Från: Admin
                </div>
              </div>
              
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {notif.content}
              </p>
              
              <Link 
                href={`/dashboard/groups/${notif.group_id}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:gap-3 transition-all"
              >
                Gå till grupp <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
