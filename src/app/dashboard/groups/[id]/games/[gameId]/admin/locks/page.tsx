import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, Unlock, Zap } from 'lucide-react'
import { toggleStageLock, lockAllGroupStages } from './actions'
import { compareStages } from '@/lib/utils/stages'
import { formatInTimeZone } from 'date-fns-tz'

const TIMEZONE = 'Europe/Stockholm'

interface StageLockMetadata {
  locked_at?: string
  locked_by_name?: string
  unlocked_at?: string
  unlocked_by_name?: string
}

interface StageLocksMetadata {
  [stageName: string]: StageLockMetadata
}

export default async function LocksAdminPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const resolvedParams = await params;
  const { id: groupId, gameId } = resolvedParams;
  const supabase = await createClient()

  // Kolla om admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: groupMember } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (groupMember?.role !== 'admin') {
    redirect(`/dashboard/groups/${groupId}/games/${gameId}`)
  }

  // Hämta spelet för att veta vilka faser som är låsta samt metadata
  const { data: game } = await supabase
    .from('games')
    .select('locked_stages, stage_locks_metadata')
    .eq('id', gameId)
    .single()

  if (!game) return <div>Spel hittades inte</div>

  const lockedStages = game.locked_stages || []
  const stageLocksMetadata = ((game as any).stage_locks_metadata as StageLocksMetadata) || {}

  // Hämta alla unika faser (stages/grupper) från matcherna
  const { data: matches } = await supabase
    .from('matches')
    .select('stage, group_name')
    .eq('game_id', gameId)

  // Skapa en unik lista över alla grupper/faser (Samma logik som Tipssidan)
  const uniqueStagesSet = new Set<string>();
  if (matches) {
    matches.forEach(m => {
      const key = m.group_name || m.stage || 'Övrigt';
      uniqueStagesSet.add(key);
    });
  }

  // Sortera listan logiskt
  const uniqueStages = Array.from(uniqueStagesSet).sort(compareStages);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href={`/dashboard/groups/${groupId}/games/${gameId}/admin`} className="inline-flex items-center text-sm font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till Admin
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">Lås & Lås Upp Faser</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-2xl">
            Som standard låses alla tips exakt när en match startar (kickoff). Här kan du dock tvångslåsa hela faser (tex alla Slutspelsmatcher) i förväg så ingen kan ändra sina tips, oavsett om matcherna startat eller inte.
          </p>
        </div>
      </div>
      <div className="mb-10 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/50">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-bold text-indigo-900 dark:text-indigo-100">Snabbval</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={lockAllGroupStages.bind(null, gameId, groupId, true)}>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-sm active:scale-95">
              Lås alla gruppspel
            </button>
          </form>
          <form action={lockAllGroupStages.bind(null, gameId, groupId, false)}>
            <button type="submit" className="px-4 py-2 bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-indigo-50 dark:hover:bg-zinc-700 transition active:scale-95">
              Lås upp alla gruppspel
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {uniqueStages.map(stage => {
            const isLocked = lockedStages.includes(stage)
            const metadata = stageLocksMetadata[stage]
            
            return (
              <div key={stage} className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{stage}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Status: {isLocked ? 'Manuellt Låst' : 'Automatiskt (Låses vid avspark)'}
                  </p>
                  {metadata && (metadata.locked_at || metadata.unlocked_at) && (
                    <div className="mt-2 space-y-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      {metadata.unlocked_at && (
                        <div>
                          Senast upplåst: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{formatInTimeZone(new Date(metadata.unlocked_at), TIMEZONE, 'yyyy-MM-dd HH:mm')}</span> av <span className="font-semibold text-zinc-600 dark:text-zinc-300">{metadata.unlocked_by_name}</span>
                        </div>
                      )}
                      {isLocked && metadata.locked_at && (
                        <div>
                          Manuellt låst: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{formatInTimeZone(new Date(metadata.locked_at), TIMEZONE, 'yyyy-MM-dd HH:mm')}</span> av <span className="font-semibold text-zinc-600 dark:text-zinc-300">{metadata.locked_by_name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <form action={toggleStageLock.bind(null, gameId, groupId, stage, !isLocked, lockedStages)}>
                  <button
                    type="submit"
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95 ${
                      isLocked 
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700' 
                        : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400'
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        Lås Upp
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Lås Nu
                      </>
                    )}
                  </button>
                </form>
              </div>
            )
          })}
          
          {uniqueStages.length === 0 && (
            <div className="p-12 text-center text-zinc-500">
              Inga faser hittades. Spelet kanske inte har några matcher inlästa ännu.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

