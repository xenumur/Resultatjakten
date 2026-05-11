import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { updatePaymentStatus } from './actions'
import { SendNotificationForm } from '@/components/SendNotificationForm'

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

  const { data: members } = await supabase
    .from('group_members')
    .select(`
      role,
      payment_status,
      user_id,
      profiles:user_id(display_name, email)
    `)
    .eq('group_id', groupId)

  const isAdmin = members?.some(m => m.user_id === user.id && m.role === 'admin')

  if (!isAdmin) {
    return <div className="p-12 text-center text-red-500">Åtkomst nekad. Endast för administratörer.</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12">
      <div className="flex justify-between items-center mb-8">
        <Link href={`/dashboard/groups/${groupId}`} className="text-sm font-semibold text-zinc-600 hover:text-indigo-600 transition-colors">
          &larr; Tillbaka till Gruppen
        </Link>
        <SendNotificationForm groupId={groupId} />
      </div>

      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-8">Gruppadmin</h1>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="p-4 font-semibold text-zinc-500 dark:text-zinc-400">Namn</th>
              <th className="p-4 font-semibold text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Roll</th>
              <th className="p-4 font-semibold text-zinc-500 dark:text-zinc-400">Status</th>
              <th className="p-4 font-semibold text-zinc-500 dark:text-zinc-400 text-right">Ändra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {members?.map(member => {
              const bindedAction = updatePaymentStatus.bind(null, groupId, member.user_id)
              return (
                <tr key={member.user_id}>
                  <td className="p-4 font-semibold text-zinc-900 dark:text-white">
                    {(member.profiles as any)?.display_name || (member.profiles as any)?.email}
                  </td>
                  <td className="p-4 text-zinc-500 dark:text-zinc-400 capitalize hidden md:table-cell">{member.role}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                      member.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      member.payment_status === 'waived' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {member.payment_status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <form action={bindedAction} className="flex justify-end gap-2">
                      <select name="status" defaultValue={member.payment_status} className="text-sm px-3 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none">
                        <option value="pending">Väntar (Pending)</option>
                        <option value="paid">Betald (Paid)</option>
                        <option value="waived">Frikallad (Waived)</option>
                      </select>
                      <button type="submit" className="text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1 rounded-md font-semibold transition">
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
  )
}
