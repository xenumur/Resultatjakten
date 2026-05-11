import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import GraderClient from './GraderClient'

export default async function GradePage({
  params,
}: {
  params: Promise<{ id: string, questionId: string }>
}) {
  const resolvedParams = await params
  const groupId = resolvedParams.id
  const questionId = resolvedParams.questionId
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: question } = await supabase
    .from('bonus_questions')
    .select('*')
    .eq('id', questionId)
    .single()

  const { data: answers } = await supabase
    .from('bonus_answers')
    .select('*, profiles:user_id(display_name)')
    .eq('question_id', questionId)
    .order('submitted_at', { ascending: true })

  if (!question) redirect(`/dashboard/groups/${groupId}/bonus/admin`)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:px-10 md:py-12 space-y-12">
      <Link href={`/dashboard/groups/${groupId}/bonus/admin`} className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition flex items-center gap-2">
        <ArrowLeft className="w-3.5 h-3.5" /> Tillbaka till Admin
      </Link>
      
      <GraderClient question={question} answers={answers || []} groupId={groupId} />
    </div>
  )
}
