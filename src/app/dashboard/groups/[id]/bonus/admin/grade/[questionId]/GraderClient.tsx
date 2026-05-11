'use client'

import { gradeBonusAnswer } from '../../../actions'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'

export default function GraderClient({ question, answers, groupId }: { question: any, answers: any[], groupId: string }) {
  const [localAnswers, setLocalAnswers] = useState(answers)

  return (
    <div className="space-y-12">
      <div className="bg-zinc-950 p-8 md:p-12 rounded-[40px] text-white space-y-4 shadow-2xl relative overflow-hidden">
        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Rättningsvy</div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">{question.question_text}</h1>
        <p className="text-zinc-400 font-bold max-w-2xl">{question.description}</p>
        <div className="flex items-center gap-4 pt-4">
          <span className="bg-white/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">Max {question.max_points} Poäng</span>
          <span className="bg-white/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">{answers.length} Svar</span>
        </div>
      </div>

      <div className="grid gap-6">
        {answers.map(ans => (
          <div key={ans.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-zinc-500">
                    {(ans.profiles?.display_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">{ans.profiles?.display_name || 'Okänd deltagare'}</div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Inskickat {new Date(ans.submitted_at).toLocaleString('sv-SE')}</div>
                  </div>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="font-bold text-zinc-700 dark:text-zinc-300 italic">"{ans.answer_text}"</p>
                </div>
              </div>

              <div className="w-full md:w-80 shrink-0">
                <form action={async (fd) => {
                  fd.append('answerId', ans.id)
                  fd.append('questionId', question.id)
                  fd.append('groupId', groupId)
                  await gradeBonusAnswer(fd)
                }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Poäng (0-{question.max_points})</label>
                    <input 
                      name="points" 
                      type="number" 
                      max={question.max_points} 
                      min={0}
                      defaultValue={ans.points_awarded ?? ''}
                      required 
                      className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-black text-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Kommentar (frivillig)</label>
                    <textarea 
                      name="comment" 
                      defaultValue={ans.grading_comment ?? ''}
                      placeholder="Bra motivering!"
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-600 font-bold text-sm h-20"
                    />
                  </div>
                  <SubmitButton className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition shadow-lg">
                    Spara Rättning
                  </SubmitButton>
                  
                  {ans.graded_at && (
                    <div className="flex items-center justify-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest pt-2">
                      <CheckCircle className="w-3 h-3" /> Rättad
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        ))}

        {answers.length === 0 && (
          <div className="p-20 text-center text-zinc-400 font-black uppercase tracking-widest italic border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[40px]">
            Inga svar har kommit in än.
          </div>
        )}
      </div>
    </div>
  )
}
