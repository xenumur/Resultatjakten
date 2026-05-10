'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleStageLock(gameId: string, groupId: string, stage: string, isLocked: boolean, currentLockedStages: string[], _formData: FormData) {
  const supabase = await createClient()

  let newLockedStages = [...(currentLockedStages || [])];
  
  if (isLocked) {
    if (!newLockedStages.includes(stage)) newLockedStages.push(stage);
  } else {
    newLockedStages = newLockedStages.filter(s => s !== stage);
  }

  const { error } = await supabase
    .from('games')
    .update({ locked_stages: newLockedStages })
    .eq('id', gameId)

  if (error) {
    console.error("Fel vid låsning av stage:", error)
  }

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin/locks`)
  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/predictions`)
}

export async function lockAllGroupStages(gameId: string, groupId: string, lock: boolean, _formData: FormData) {
  const supabase = await createClient()

  // 1. Hämta alla unika group_names för detta spel
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

  // 2. Hämta nuvarande låsta stages
  const { data: game } = await supabase
    .from('games')
    .select('locked_stages')
    .eq('id', gameId)
    .single()

  let currentLocked = game?.locked_stages || []
  
  if (lock) {
    // Lägg till alla gruppnamn som inte redan finns
    groupNames.forEach(name => {
      if (!currentLocked.includes(name)) currentLocked.push(name)
    })
  } else {
    // Ta bort alla gruppnamn
    currentLocked = currentLocked.filter((name: string) => !groupNames.includes(name))
  }

  const { error } = await supabase
    .from('games')
    .update({ locked_stages: currentLocked })
    .eq('id', gameId)

  if (error) {
    console.error(error.message)
  }

  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/admin/locks`)
  revalidatePath(`/dashboard/groups/${groupId}/games/${gameId}/predictions`)
}
