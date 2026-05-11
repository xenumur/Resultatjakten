'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Lock, CheckCircle, Play, ChevronRight, HelpCircle, X } from 'lucide-react'
import { createBonusQuestion, updateBonusQuestion, deleteBonusQuestion, setQuestionStatus } from '../actions'
import Link from 'next/link'
import { SubmitButton } from '@/components/ui/SubmitButton'

export default function BonusAdminClient({ groupId, initialQuestions }: { groupId: string, initialQuestions: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)

  const handleOpenModal = (question = null) => {
    setEditingQuestion(question)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setEditingQuestion(null)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Hantera Bonusfrågor</h1>
          <p className="text-zinc-500 text-sm">Skapa och rätta frågor för din grupp.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" /> Skapa Fråga
        </button>
      </div>

      <div className="grid gap-6">
        {initialQuestions.length === 0 ? (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <HelpCircle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 font-bold">Inga bonusfrågor skapade än.</p>
          </div>
        ) : (
          initialQuestions.map(q => (
            <div key={q.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                    q.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                    q.status === 'locked' ? 'bg-amber-100 text-amber-600' :
                    q.status === 'graded' ? 'bg-indigo-100 text-indigo-600' :
                    'bg-zinc-100 text-zinc-600'
                  }`}>
                    {q.status}
                  </span>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Max {q.max_points} poäng</span>
                </div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white truncate">{q.question_text}</h3>
                <p className="text-zinc-500 text-sm truncate">{q.description || 'Ingen beskrivning'}</p>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Deadline: {new Date(q.deadline).toLocaleString('sv-SE')}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {q.status === 'draft' && (
                  <button onClick={() => setQuestionStatus(q.id, groupId, 'active')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition" title="Publicera">
                    <Play className="w-5 h-5" />
                  </button>
                )}
                {q.status === 'active' && (
                  <button onClick={() => setQuestionStatus(q.id, groupId, 'locked')} className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition" title="Lås för svar">
                    <Lock className="w-5 h-5" />
                  </button>
                )}
                {(q.status === 'locked' || q.status === 'graded') && (
                  <Link href={`/dashboard/groups/${groupId}/bonus/admin/grade/${q.id}`} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs hover:bg-indigo-100 transition">
                    Rätta Svar <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
                <button onClick={() => handleOpenModal(q)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-xl transition">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={() => deleteBonusQuestion(q.id, groupId)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[40px] shadow-2xl p-8 relative">
            <button onClick={handleCloseModal} className="absolute top-6 right-6 p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition">
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-8">
              {editingQuestion ? 'Redigera Fråga' : 'Ny Bonusfråga'}
            </h2>

            <form action={async (fd) => {
              fd.append('groupId', groupId)
              if (editingQuestion) {
                fd.append('questionId', editingQuestion.id)
                await updateBonusQuestion(fd)
              } else {
                await createBonusQuestion(fd)
              }
              handleCloseModal()
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Frågetext</label>
                <input 
                  name="questionText" 
                  defaultValue={editingQuestion?.question_text}
                  required 
                  placeholder="Vem vinner skytteligan?"
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Beskrivning (frivillig)</label>
                <textarea 
                  name="description" 
                  defaultValue={editingQuestion?.description}
                  placeholder="Extra info..."
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Maxpoäng</label>
                  <input 
                    name="maxPoints" 
                    type="number" 
                    defaultValue={editingQuestion?.max_points || 5}
                    required 
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingQuestion?.status || 'draft'}
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold appearance-none"
                  >
                    <option value="draft">Utkast</option>
                    <option value="active">Aktiv</option>
                    <option value="locked">Låst</option>
                    <option value="graded">Rättad</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Deadline</label>
                <input 
                  name="deadline" 
                  type="datetime-local" 
                  defaultValue={editingQuestion?.deadline ? new Date(editingQuestion.deadline).toISOString().slice(0, 16) : ''}
                  required 
                  className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold"
                />
              </div>

              <div className="pt-4">
                <SubmitButton className="w-full py-5 rounded-[24px] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-600/20 transition-all">
                  {editingQuestion ? 'Spara Ändringar' : 'Skapa Fråga'}
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
