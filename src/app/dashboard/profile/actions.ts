'use client'

import { createClient } from '@/lib/supabase/client'

export async function updateThemePreference(theme: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return
  
  const { error } = await supabase
    .from('profiles')
    .update({ theme_preference: theme })
    .eq('id', user.id)
    
  if (error) throw error
}
