import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { updatePaymentStatus, updateGroupSettings } from './actions'
import { GroupSettingsForm } from './GroupSettingsForm'
import { DeleteGroupButton } from './DeleteGroupButton'
import { Settings, Users, ArrowLeft } from 'lucide-react'

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

  const [{ data: group }, { data: members }] = await Promise.all([
    supabase.from('groups').select('*').eq('id', groupId).single(),
    supabase.from('group_members').select('role, payment_status, user_id, profiles:user_id(display_name, email)').eq('group_id', groupId)
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

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left: General Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Gruppinställningar</h2>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 rounded-[32px] shadow-sm">
            <GroupSettingsForm 
              groupId={groupId} 
              action={boundUpdateSettings} 
              initialData={{
                name: group.name,
                description: group.description,
                entry_fee: group.entry_fee,
                currency: group.currency,
                payment_info: group.payment_info
              }} 
            />
          </div>
          <DeleteGroupButton groupId={groupId} />
        </div>

        {/* Right: Members & Payments */}
        <div className="lg:col-span-2 space-y-6">
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
                    const bindedAction = updatePaymentStatus.bind(null, groupId, member.user_id)
                    const p = member.profiles as any
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
                          <form action={bindedAction} className="flex justify-end gap-2">
                            <select 
                              name="status" 
                              defaultValue={member.payment_status} 
                              className="text-xs font-bold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            >
                              <option value="pending">Väntar</option>
                              <option value="paid">Betald</option>
                            </select>
                            <button type="submit" className="text-xs font-black bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-xl hover:opacity-80 transition active:scale-95">
                              Spara
                            </button>
                          </form>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
