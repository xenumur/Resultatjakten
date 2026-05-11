import { joinGroup } from './actions'
import Link from 'next/link'
import { JoinGroupForm } from './JoinGroupForm'

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

        <JoinGroupForm action={joinGroup} />
      </div>
    </div>
  )
}
