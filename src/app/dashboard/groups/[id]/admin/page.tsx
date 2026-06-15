import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { updateGroupSettings } from './actions'
import { GroupSettingsForm } from './GroupSettingsForm'
import { PaymentStatusForm } from './PaymentStatusForm'
import { DeleteGroupButton } from './DeleteGroupButton'
import { RemoveMemberButton } from './RemoveMemberButton'
import { DeadlineManagement } from './DeadlineManagement'
import { StatusUpdateTrigger } from './StatusUpdateTrigger'
import { Settings, Users, ArrowLeft, Bell } from 'lucide-react'

export default async function GroupAdminPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const groupId = resolvedParams.id;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: group }, { data: members }, { data: deadlines }] = await Promise.all([
    supabase.from('groups').select('*').eq('id', groupId).single(),
    supabase.from('group_members').select('role, payment_status, user_id, profiles:user_id(display_name, email)').eq('group_id', groupId),
    supabase.from('group_deadlines').select('*').eq('group_id', groupId).order('deadline_at', { ascending: true })
  ])

  const isAdmin = members?.some(m => m.user_id === user.id && m.role === 'admin')

  if (!isAdmin || !group) {
    return <div className="p-12 text-center text-red-500 font-bold">Åtkomst nekad. Endast för administratörer.</div>
  }

  const boundUpdateSettings = updateGroupSettings.bind(null, groupId)

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link href={`/dashboard/groups/${groupId}`} className="text-sm font-bold text-zinc-500 hover:text-indigo-600 mb-2 inline-flex items-center gap-1 transition">
            <ArrowLeft className="w-4 h-4" /> Tillbaka till Gruppen
          </Link>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white">Inställningar & Admin</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Hantera din grupp, dess medlemmar och betalstatus.</p>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        {/* Top: General Settings */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Gruppinställningar</h2>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 md:p-10 rounded-[40px] shadow-sm">
            <GroupSettingsForm 
              groupId={groupId} 
              action={boundUpdateSettings} 
              initialData={{
                name: group.name,
                description: group.description,
                entry_fee: group.entry_fee,
                currency: group.currency,
                payment_info: group.payment_info,
                hide_group_info: group.hide_group_info
              }} 
            />
          </div>
        </div>

        {/* Row for Deadlines and Status Update */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Deadlines */}
          <DeadlineManagement groupId={groupId} initialDeadlines={deadlines || []} />

          {/* Status Update Trigger */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">Utskick</h2>
            </div>
            <StatusUpdateTrigger groupId={groupId} />
          </div>
        </div>

        {/* Members & Payments */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Medlemmar & Betalningar</h2>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Deltagare</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Åtgärd</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {members?.map(member => {
                    const p = (member.profiles as unknown) as { display_name: string | null; email: string | null } | null
                    return (
                      <tr key={member.user_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-5">
                          <div className="font-bold text-zinc-900 dark:text-white">
                            {p?.display_name || p?.email}
                          </div>
                          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">
                            {member.role}
                          </div>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${
                            member.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {member.payment_status}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex justify-end items-center gap-2">
                            <PaymentStatusForm 
                              groupId={groupId} 
                              userId={member.user_id} 
                              initialStatus={member.payment_status} 
                            />
                            <div className="w-10 flex justify-center">
                              {member.user_id !== user.id && (
                                <RemoveMemberButton 
                                  groupId={groupId} 
                                  userId={member.user_id} 
                                  userName={p?.display_name || p?.email || 'Medlem'} 
                                />
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Danger Zone: Delete Group at the bottom */}
        <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800">
          <DeleteGroupButton groupId={groupId} />
        </div>
      </div>
    </div>
  )
}
