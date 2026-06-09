'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleStageLock(
  gameId: string, 
  groupId: string, 
  stage: string, 
  isLocked: boolean, 
  currentLockedStages: string[], 
  _formData: FormData
) {
  const supabase = await createClient()

  // 1. Hämta den inloggade administratören
  const { data: { user } } = await supabase.auth.getUser()
  let userName = 'System'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single()
    userName = profile?.display_name || user.email || 'Okänd admin'
  }

  // 2. Hämta spelets nuvarande status för att undvika race conditions
  const { data: game } = await supabase
    .from('games')
    .select('locked_stages, stage_locks_metadata')
    .eq('id', gameId)
    .single()

  const currentLocked = game?.locked_stages || []
  let newLockedStages = [...currentLocked];
  
  if (isLocked) {
    if (!newLockedStages.includes(stage)) newLockedStages.push(stage);
  } else {
    newLockedStages = newLockedStages.filter(s => s !== stage);
  }

  // 3. Uppdatera metadata för den specifika fasen
  const currentMetadata = (game as any)?.stage_locks_metadata || {}
  const now = new Date().toISOString()
  const stageMetadata = { ...(currentMetadata[stage] || {}) }

  if (isLocked) {
    stageMetadata.locked_at = now
    stageMetadata.locked_by_name = userName
  } else {
    stageMetadata.unlocked_at = now
    stageMetadata.unlocked_by_name = userName
  }

  const newMetadata = {
    ...currentMetadata,
    [stage]: stageMetadata
  }

  const { error } = await supabase
    .from('games')
    .update({ 
      locked_stages: newLockedStages,
      stage_locks_metadata: newMetadata
    })
    .eq('id', gameId)

  if (error) {
    console.error("Fel vid låsning av stage:", error)
  }

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin/locks`)
  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/predictions`)
}

export async function lockAllGroupStages(gameId: string, groupId: string, lock: boolean, _formData: FormData) {
  const supabase = await createClient()

  // 1. Hämta den inloggade administratören
  const { data: { user } } = await supabase.auth.getUser()
  let userName = 'System'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single()
    userName = profile?.display_name || user.email || 'Okänd admin'
  }

  // 2. Hämta alla unika group_names för detta spel
  const { data: matches } = await supabase
    .from('matches')
    .select('group_name')
    .eq('game_id', gameId)
    .not('group_name', 'is', null)

  if (!matches) {
    console.error('Inga matcher hittades.')
    return
  }
  
  const groupNames = Array.from(new Set(matches.map(m => m.group_name as string)))

  // 3. Hämta nuvarande låsta stages och metadata
  const { data: game } = await supabase
    .from('games')
    .select('locked_stages, stage_locks_metadata')
    .eq('id', gameId)
    .single()

  let currentLocked = game?.locked_stages || []
  
  if (lock) {
    groupNames.forEach((name: string) => {
      if (!currentLocked.includes(name)) currentLocked.push(name)
    })
  } else {
    currentLocked = currentLocked.filter((name: string) => !groupNames.includes(name))
  }

  // 4. Uppdatera metadata för alla grupperna
  const currentMetadata = (game as any)?.stage_locks_metadata || {}
  const now = new Date().toISOString()
  const newMetadata = { ...currentMetadata }

  groupNames.forEach((name: string) => {
    const stageMetadata = { ...(newMetadata[name] || {}) }
    if (lock) {
      stageMetadata.locked_at = now
      stageMetadata.locked_by_name = userName
    } else {
      stageMetadata.unlocked_at = now
      stageMetadata.unlocked_by_name = userName
    }
    newMetadata[name] = stageMetadata
  })

  const { error } = await supabase
    .from('games')
    .update({ 
      locked_stages: currentLocked,
      stage_locks_metadata: newMetadata
    })
    .eq('id', gameId)

  if (error) {
    console.error("Fel vid låsning av alla gruppsteg:", error)
  }

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin/locks`)
  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/predictions`)
}

