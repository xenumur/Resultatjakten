import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-zinc-950 to-zinc-950 -z-10" />
      
      <div className="max-w-3xl text-center space-y-8 z-10">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Skorio" className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] shadow-2xl mb-4" />
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 drop-shadow-sm">
            Skorio
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-zinc-400 font-light max-w-2xl mx-auto">
          Tippa fotbollsturneringar som VM 2026 med dina vänner. Skapa privata grupper, följ matcherna live och klättra på leaderboarden!
        </p>
        
        <div className="pt-8">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all bg-indigo-600 rounded-2xl hover:bg-indigo-500 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] active:scale-95"
          >
            Börja tippa nu
          </Link>
        </div>
      </div>
    </main>
  )
}
