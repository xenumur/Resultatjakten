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

  // 1. Hämta alla svar
  const { data: rawAnswers, error: answersError } = await supabase
    .from('bonus_answers')
    .select('*')
    .eq('question_id', questionId)
    .order('submitted_at', { ascending: true })

  if (answersError) {
    console.error('Fel vid hämtning av svar:', answersError.message)
  }

  // 2. Hämta profiler för dessa svar (om det finns några)
  let answers = rawAnswers || []
  if (answers.length > 0) {
    const userIds = answers.map(a => a.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)

    // 3. Slå ihop svar med profiler
    answers = answers.map(a => ({
      ...a,
      profiles: profiles?.find(p => p.id === a.user_id) || { display_name: 'Okänd' }
    }))
  }

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
