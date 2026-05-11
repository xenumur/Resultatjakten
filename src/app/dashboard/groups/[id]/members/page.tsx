import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { updateMemberRole } from '../admin/actions'
import { SendNotificationForm } from '@/components/SendNotificationForm'

export default async function GroupMembersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const groupId = resolvedParams.id;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: members, error } = await supabase
    .from('group_members')
    .select(`
      role,
      user_id,
      profiles:user_id(display_name, email)
    `)
    .eq('group_id', groupId)

  if (error || !members) {
    return <div className="p-12 text-center text-red-500">Kunde inte hämta deltagare.</div>
  }

  const currentUserMember = members.find(m => m.user_id === user.id)
  const isAdmin = currentUserMember?.role === 'admin'

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12">
      <Link href={`/dashboard/groups/${groupId}`} className="group text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-8 inline-flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Tillbaka till Gruppen
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white mb-3 tracking-tight">Deltagare</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">Administratörer kan hantera roller och behörigheter.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          {isAdmin && <SendNotificationForm groupId={groupId} />}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 px-4 py-2 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {members.length} {members.length === 1 ? 'medlem' : 'medlemmar'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {members.sort((a, b) => (a.role === 'admin' ? -1 : 1)).map(member => {
            const displayName = (member.profiles as any)?.display_name || (member.profiles as any)?.email
            const isSelf = member.user_id === user.id
            const memberRole = member.role === 'admin' ? 'admin' : 'participant'
            const nextRole = memberRole === 'admin' ? 'participant' : 'admin'
            
            // Server Action binding
            const toggleRoleAction = updateMemberRole.bind(null, groupId, member.user_id, nextRole)
            
            return (
              <div key={member.user_id} className="p-6 md:p-8 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner ${
                    member.role === 'admin' 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {displayName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-white text-lg flex items-center gap-2.5">
                      {displayName}
                      {isSelf && (
                        <span className="text-[10px] uppercase tracking-widest font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-2 py-0.5 rounded-full">
                          Dig
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {member.role === 'admin' ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          Administratör
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          Deltagare
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isAdmin && !isSelf && (
                  <form action={toggleRoleAction}>
                    <button 
                      type="submit"
                      className={`group relative text-sm font-bold px-6 py-3 rounded-2xl transition-all active:scale-95 ${
                        member.role === 'admin' 
                          ? 'bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/30 text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400'
                          : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white'
                      }`}
                    >
                      {member.role === 'admin' ? 'Ta bort admin' : 'Gör till admin'}
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {isAdmin && (
        <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-[2rem] flex items-start gap-4">
          <div className="text-2xl mt-1">💡</div>
          <div className="text-sm text-indigo-900/70 dark:text-indigo-300/70 leading-relaxed">
            <p className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Admin-tips</p>
            Som administratör kan du utse andra medlemmar till administratörer. De kommer då ha samma rättigheter som du att hantera spel, godkänna betalningar och ändra gruppinställningar.
          </div>
        </div>
      )}
    </div>
  )
}
