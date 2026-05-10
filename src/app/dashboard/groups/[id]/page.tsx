import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const groupId = resolvedParams.id;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: group, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members!inner(role, user_id)
    `)
    .eq('id', groupId)
    .single()

  if (error || !group) {
    return <div className="p-8 text-center text-red-500">Kunde inte hitta gruppen.</div>
  }

  const userMember = group.group_members.find((m: any) => m.user_id === user.id)
  const isAdmin = userMember?.role === 'admin'

  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('group_id', groupId)

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12">
      <Link href="/dashboard" className="text-sm font-semibold text-indigo-600 mb-8 inline-block hover:underline">
        &larr; Mina grupper
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white mb-2">{group.name}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-xl">{group.description}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col items-center min-w-[200px]">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Inbjudningskod</span>
          <span className="text-2xl font-mono font-bold tracking-wider text-indigo-600 dark:text-indigo-400 mt-1">
            {group.join_code}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Aktiva Spel</h2>
              {isAdmin && (
                <Link href={`/dashboard/groups/${groupId}/games/create`} className="text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                  + Skapa spel
                </Link>
              )}
            </div>
            
            {games && games.length > 0 ? (
              <div className="grid gap-4">
                {games.map(game => (
                  <Link key={game.id} href={`/dashboard/groups/${groupId}/games/${game.id}`} className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl hover:border-indigo-500 transition-colors">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{game.name}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{game.tournament_type}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-8 text-center border border-dashed border-zinc-300 dark:border-zinc-700">
                <p className="text-zinc-500 dark:text-zinc-400">Inga spel har skapats i denna grupp ännu.</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Gruppinformation</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Insats per person</span>
                <span className="font-semibold">{group.entry_fee} {group.currency}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Din roll</span>
                <span className="font-semibold capitalize text-indigo-600">{userMember?.role}</span>
              </li>
            </ul>
            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <Link href={`/dashboard/groups/${groupId}/admin`} className="block w-full text-center bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white py-3 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                  ⚙️ Hantera Betalningar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
