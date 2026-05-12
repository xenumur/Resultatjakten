'use client'

import { useState } from 'react'
import { submitBonusAnswer } from './actions'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { CheckCircle, Lock, Trophy, MessageSquare, AlertCircle, ChevronRight, Settings } from 'lucide-react'
import Link from 'next/link'

export default function BonusClient({ 
  groupId, 
  questions, 
  userAnswers, 
  isAdmin 
}: { 
  groupId: string, 
  questions: any[], 
  userAnswers: any[], 
  isAdmin: boolean 
}) {
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null)

  const findUserAnswer = (qId: string) => userAnswers.find(a => a.question_id === qId)

  return (
    <div className="space-y-12">
      {/* Header Widget */}
      <div className="bg-zinc-950 p-8 md:p-12 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Trophy className="w-32 h-32 text-indigo-500" />
        </div>
        <div className="space-y-4 relative z-10 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">Bonusfrågor</h1>
          <p className="text-zinc-400 font-bold max-w-xl text-lg">Svara på specialfrågor och samla extrapoäng till din gruppplacering!</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
            <Link href={`/dashboard/groups/${groupId}/bonus/leaderboard`} className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition">
              <Trophy className="w-4 h-4" /> Leaderboard
            </Link>
            {isAdmin && (
              <Link href={`/dashboard/groups/${groupId}/bonus/admin`} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition">
                <Settings className="w-4 h-4" /> Hantera Frågor
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="grid gap-8">
        {questions.length === 0 ? (
          <div className="p-20 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[40px] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500 font-black uppercase tracking-widest italic">Inga bonusfrågor tillgängliga just nu.</p>
          </div>
        ) : (
          questions.map(q => {
            const answer = findUserAnswer(q.id)
            const isLocked = q.status === 'locked' || q.status === 'graded' || (q.deadline && new Date(q.deadline) < new Date())
            const isGraded = q.status === 'graded' && answer?.points_awarded !== null

            return (
              <div key={q.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-8 md:p-10">
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        {isGraded ? (
                          <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Trophy className="w-3 h-3" /> {answer.points_awarded} / {q.max_points} Poäng
                          </div>
                        ) : (
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                            isLocked ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {isLocked ? <Lock className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                            {isLocked ? 'Stängd' : 'Öppen'}
                          </div>
                        )}
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Max {q.max_points} poäng</span>
                      </div>
                      
                      <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{q.question_text}</h3>
                      {q.description && <p className="text-zinc-500 font-bold text-sm">{q.description}</p>}
                      
                      {!isLocked && (
                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" /> Deadline: {new Date(q.deadline).toLocaleString('sv-SE')}
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-96 shrink-0">
                      {isLocked ? (
                        <div className="space-y-4">
                          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Ditt Svar</span>
                            <p className="font-bold text-zinc-800 dark:text-zinc-200 italic">
                              {answer ? `"${answer.answer_text}"` : 'Inget svar inskickat.'}
                            </p>
                          </div>
                          {answer?.grading_comment && (
                            <div className="flex gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                              <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0 mt-1" />
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block mb-1">Admin Kommentar</span>
                                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">{answer.grading_comment}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <form action={async (fd) => {
                          fd.append('questionId', q.id)
                          fd.append('groupId', groupId)
                          await submitBonusAnswer(fd)
                          setAnsweringQuestionId(null)
                        }} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ditt Svar (Fritext)</label>
                            <textarea 
                              name="answerText" 
                              defaultValue={answer?.answer_text}
                              required 
                              placeholder="Skriv ditt svar här..."
                              className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold h-24"
                            />
                          </div>
                          <SubmitButton className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition shadow-lg">
                            {answer ? 'Uppdatera Svar' : 'Skicka Svar'}
                          </SubmitButton>
                          {answer && (
                            <div className="flex items-center justify-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest pt-2">
                              <CheckCircle className="w-3 h-3" /> Svar Inskickat
                            </div>
                          )}
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
