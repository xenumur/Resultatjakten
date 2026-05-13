'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBonusQuestion(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const groupId = formData.get('groupId') as string
  const questionText = formData.get('questionText') as string
  const description = formData.get('description') as string
  const maxPoints = parseInt(formData.get('maxPoints') as string)
  const deadline = formData.get('deadline') as string
  const status = formData.get('status') as string || 'draft'

  const { error } = await supabase.from('bonus_questions').insert({
    group_id: groupId,
    question_text: questionText,
    description: description,
    max_points: maxPoints,
    status: status
  })

  if (error) throw error
  revalidatePath(`/dashboard/groups/${groupId}/bonus`)
  revalidatePath(`/dashboard/groups/${groupId}/bonus/admin`)
}

export async function updateBonusQuestion(formData: FormData) {
  const supabase = await createClient()
  const questionId = formData.get('questionId') as string
  const groupId = formData.get('groupId') as string
  
  const updates: any = {
    question_text: formData.get('questionText'),
    description: formData.get('description'),
    max_points: parseInt(formData.get('maxPoints') as string),
    status: formData.get('status'),
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('bonus_questions')
    .update(updates)
    .eq('id', questionId)

  if (error) throw error
  revalidatePath(`/dashboard/groups/${groupId}/bonus`)
  revalidatePath(`/dashboard/groups/${groupId}/bonus/admin`)
}

export async function deleteBonusQuestion(questionId: string, groupId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('bonus_questions')
    .delete()
    .eq('id', questionId)

  if (error) throw error
  revalidatePath(`/dashboard/groups/${groupId}/bonus`)
  revalidatePath(`/dashboard/groups/${groupId}/bonus/admin`)
}

export async function submitBonusAnswer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const questionId = formData.get('questionId') as string
  const groupId = formData.get('groupId') as string
  const answerText = formData.get('answerText') as string

  const { error } = await supabase.from('bonus_answers').upsert({
    question_id: questionId,
    user_id: user.id,
    answer_text: answerText,
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'question_id,user_id'
  })

  if (error) throw error
  revalidatePath(`/dashboard/groups/${groupId}/bonus`)
}

import { snapshotGroupLeaderboard } from '@/lib/scoring/leaderboard'

export async function gradeBonusAnswer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const answerId = formData.get('answerId') as string
  const questionId = formData.get('questionId') as string
  const groupId = formData.get('groupId') as string
  const points = parseInt(formData.get('points') as string)
  const comment = formData.get('comment') as string

  // Endast snapshot om poängen faktiskt ändras
  const { data: existing } = await supabase
    .from('bonus_answers')
    .select('points_awarded')
    .eq('id', answerId)
    .single()

  if (existing && existing.points_awarded !== points) {
    await snapshotGroupLeaderboard(groupId)
  }

  const { error } = await supabase
    .from('bonus_answers')
    .update({
      points_awarded: points,
      grading_comment: comment,
      graded_at: new Date().toISOString(),
      graded_by: user.id
    })
    .eq('id', answerId)

  if (error) throw error
  revalidatePath(`/dashboard/groups/${groupId}/bonus`)
  revalidatePath(`/dashboard/groups/${groupId}/bonus/admin/grade/${questionId}`)
}

export async function setQuestionStatus(questionId: string, groupId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('bonus_questions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', questionId)

  if (error) throw error
  revalidatePath(`/dashboard/groups/${groupId}/bonus`)
  revalidatePath(`/dashboard/groups/${groupId}/bonus/admin`)
}
