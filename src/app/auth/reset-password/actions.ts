'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password.length < 6) {
    return redirect('/auth/reset-password?error=' + encodeURIComponent('Lösenordet måste vara minst 6 tecken långt.'))
  }

  if (password !== confirmPassword) {
    return redirect('/auth/reset-password?error=' + encodeURIComponent('Lösenorden matchar inte.'))
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    return redirect('/auth/reset-password?error=' + encodeURIComponent(error.message))
  }

  // Redirect to dashboard since they are logged in after code exchange
  return redirect('/dashboard')
}
