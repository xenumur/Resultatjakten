import { updatePassword } from './actions'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const resolvedParams = await searchParams;
  const errorMsg = resolvedParams.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="Skorio" className="w-20 h-20 mb-4 rounded-2xl shadow-lg" />
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Välj nytt lösenord</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Skriv in ditt nya lösenord nedan för att uppdatera ditt konto.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm text-center font-medium border border-red-100 dark:border-red-800/50">
            {errorMsg}
          </div>
        )}

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5" htmlFor="password">
              Nytt lösenord
            </label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              minLength={6}
              className="block w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5" htmlFor="confirmPassword">
              Bekräfta nytt lösenord
            </label>
            <input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              required 
              minLength={6}
              className="block w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <button 
              formAction={updatePassword} 
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Spara nytt lösenord
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
