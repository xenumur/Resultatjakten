'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePaymentStatus(groupId: string, userId: string, formData: FormData) {
  const supabase = await createClient()
  const status = formData.get('status') as string

  // TODO: Verifiera admin access i backend om tid finns. RLS bör redan hindra detta.
  await supabase
    .from('group_members')
    .update({ payment_status: status })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  revalidatePath(`/dashboard/groups/${groupId}/admin`)
}
