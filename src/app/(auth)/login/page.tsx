import { login, signup, requestPasswordReset } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, message?: string, mode?: string }>
}) {
  const resolvedParams = await searchParams;
  const errorMsg = resolvedParams.error;
  const successMsg = resolvedParams.message;
  const isSignup = resolvedParams.mode === 'signup';
  const isForgot = resolvedParams.mode === 'forgot';

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="Skorio" className="w-20 h-20 mb-4 rounded-2xl shadow-lg" />
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Skorio</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            {isForgot 
              ? 'Ange din e-post för att få en återställningslänk'
              : isSignup 
                ? 'Skapa ett konto för att börja tippa' 
                : 'Logga in för att tippa och spela med vänner'}
          </p>
        </div>
        
        {successMsg === 'check_email' && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm text-center font-bold border border-emerald-100 dark:border-emerald-800/50">
            ✉️ Registreringen lyckades! Kolla din e-post för att verifiera ditt konto innan du kan logga in.
          </div>
        )}

        {successMsg === 'reset_sent' && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm text-center font-bold border border-emerald-100 dark:border-emerald-800/50">
            ✉️ Återställningslänk har skickats! Kontrollera din e-post.
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm text-center font-medium border border-red-100 dark:border-red-800/50">
            {errorMsg}
          </div>
        )}

        <form className="space-y-5">
          {isForgot ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5" htmlFor="email">
                  E-post
                </label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  className="block w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  placeholder="din.epost@exempel.se"
                />
              </div>

              <div className="pt-2">
                <button 
                  formAction={requestPasswordReset} 
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  Skicka återställningslänk
                </button>
              </div>
            </>
          ) : (
            <>
              {isSignup && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5" htmlFor="name">
                    Namn
                  </label>
                  <input 
                    id="name" 
                    name="name" 
                    type="text" 
                    required
                    className="block w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    placeholder="Ditt visningsnamn"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5" htmlFor="email">
                  E-post
                </label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  className="block w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  placeholder="din.epost@exempel.se"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5" htmlFor="password">
                  Lösenord
                </label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  className="block w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button 
                  formAction={isSignup ? signup : login} 
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  {isSignup ? 'Skapa konto' : 'Logga in'}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="mt-8 text-center border-t border-zinc-100 dark:border-zinc-800 pt-6">
          {isForgot ? (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Kommer du ihåg ditt lösenord?{' '}
              <a href="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Logga in här
              </a>
            </p>
          ) : isSignup ? (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Har du redan ett konto?{' '}
              <a href="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Logga in här
              </a>
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Inget konto ännu?{' '}
                <a href="/login?mode=signup" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Registrera dig gratis
                </a>
              </p>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                <a href="/login?mode=forgot" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Glömt lösenordet?
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
