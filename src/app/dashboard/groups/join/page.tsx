import { joinGroup } from './actions'
import Link from 'next/link'

export default function JoinGroupPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12">
      <Link href="/dashboard" className="text-sm font-semibold text-indigo-600 mb-8 inline-block hover:underline">
        &larr; Tillbaka till Dashboard
      </Link>
      
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Gå med i en grupp</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          Fyll i koden du fått av administratören för att ansluta.
        </p>

        <form className="space-y-6" action={joinGroup}>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Inbjudningskod
            </label>
            <input 
              name="joinCode" 
              required 
              placeholder="T.ex. AB12CD"
              className="w-full uppercase px-4 py-3 text-lg font-mono tracking-widest rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          
          <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md">
            Gå med i gruppen
          </button>
        </form>
      </div>
    </div>
  )
}
