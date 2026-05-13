import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, GitMerge } from 'lucide-react'
import { BracketView } from './BracketView'

export default async function BracketPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id: groupId, gameId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: game }, { data: matches }, { data: member }] = await Promise.all([
    supabase.from('games').select('name').eq('id', gameId).single(),
    supabase
      .from('matches')
      .select('id, stage, home_team, away_team, final_home_score, final_away_score, status, api_match_num')
      .eq('game_id', gameId)
      .in('stage', ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final', 'Match for third place']),
    supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()
  ])

  if (!member || member.role !== 'admin') {
    redirect(`/dashboard/groups/${groupId}/games/${gameId}`)
  }

  // De-duplicate matches - keep only the one with real team names if duplicate placeholder matches exist
  const deduped = deduplicateMatches(matches ?? [])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link
            href={`/dashboard/groups/${groupId}/games/${gameId}`}
            className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition flex items-center gap-2 mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Tillbaka till Spelet
          </Link>
          <div className="flex items-center gap-3">
            <GitMerge className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">
                Slutspelsbracket
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">
                {game?.name} · Uppdateras automatiskt baserat på matchresultat
              </p>
            </div>
          </div>
        </div>

        <BracketView matches={deduped} />
      </div>
    </div>
  )
}

interface Match {
  id: string
  stage: string
  home_team: string
  away_team: string
  final_home_score: number | null
  final_away_score: number | null
  status: string
  api_match_num: number | null
}

function isPlaceholder(name: string) {
  if (!name) return true
  return /^[WL]\d+$/.test(name) || name.includes('Winner') || name.includes('Loser') || name.toLowerCase() === 'tbd'
}

function deduplicateMatches(matches: Match[]): Match[] {
  // Group by stage
  const byStage: Record<string, Match[]> = {}
  for (const m of matches) {
    if (!byStage[m.stage]) byStage[m.stage] = []
    byStage[m.stage].push(m)
  }

  const result: Match[] = []
  for (const [, stageMatches] of Object.entries(byStage)) {
    // Find real matches (non-placeholder teams)
    const real = stageMatches.filter(m => !isPlaceholder(m.home_team) && !isPlaceholder(m.away_team))
    const placeholder = stageMatches.filter(m => isPlaceholder(m.home_team) || isPlaceholder(m.away_team))

    if (real.length > 0) {
      // Use real matches
      result.push(...real)
    } else {
      // Deduplicate placeholder matches (often identical duplicates across game instances)
      const seen = new Set<string>()
      for (const m of placeholder) {
        const key = `${m.home_team}|${m.away_team}`
        if (!seen.has(key)) {
          seen.add(key)
          result.push(m)
        }
      }
    }
  }

  return result
}
