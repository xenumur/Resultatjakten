import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BonusClient from './BonusClient'

export default async function BonusPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const groupId = resolvedParams.id
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  const { data: questions } = await supabase
    .from('bonus_questions')
    .select('*')
    .eq('group_id', groupId)
    .not('status', 'eq', 'draft')
    .order('created_at', { ascending: true })

  const { data: userAnswers } = await supabase
    .from('bonus_answers')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:px-10 md:py-12 space-y-12">
      <Link href={`/dashboard/groups/${groupId}`} className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition flex items-center gap-2">
        <ArrowLeft className="w-3.5 h-3.5" /> Tillbaka till Grupp
      </Link>
      
      <BonusClient 
        groupId={groupId} 
        questions={questions || []} 
        userAnswers={userAnswers || []} 
        isAdmin={member?.role === 'admin'} 
      />
    </div>
  )
}
