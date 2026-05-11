import Link from 'next/link'
import { Info, Trophy, CheckCircle2, HelpCircle, MessageSquare } from 'lucide-react'

export default function IntroductionPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-12">
      <Link href="/dashboard" className="text-sm font-semibold text-indigo-600 mb-8 inline-block hover:underline">
        &larr; Tillbaka till Dashboard
      </Link>

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[40px] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">VM 2026 – Skorio ⚽🌍</h1>
            <p className="text-indigo-100 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
              Välkommen till historiens största världsmästerskap. Här är allt du behöver veta för att bemästra Skorio!
            </p>
          </div>
        </div>

        {/* Background Section */}
        <section className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 md:p-10 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Bakgrund</h2>
          </div>
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-6">
              Fotbolls-VM 2026 blir historiens största världsmästerskap i fotboll. För första gången deltar hela 48 landslag, jämfört med tidigare 32. Turneringen arrangeras dessutom i tre värdländer samtidigt: <strong>USA, Kanada och Mexiko</strong>. Finalen spelas den 19 juli 2026 i New York/New Jersey.
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-8">
              Regerande världsmästare är <strong>Argentina</strong> som vann VM 2022 i Qatar efter en dramatisk final mot <strong>Frankrike</strong>.
            </p>
            
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">Rolig fakta att dela 🎉</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
                {[
                  'VM 2026 blir det största VM någonsin – totalt spelas 104 matcher.',
                  'Mexiko blir första landet i historien att arrangerera herr-VM tre gånger.',
                  'Flera nationer gör sina första VM-framträdanden någonsin.',
                  'Turneringen spelas över 16 olika värdstäder i Nordamerika.',
                  'Stora artistuppträdanden och festligheter vid öppningsceremonierna.'
                ].map((fact, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Instructions Section */}
        <section className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 md:p-10 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Instruktioner – Så fungerar Skorio</h2>
          </div>
ner – Så fungerar Scoriq</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Så använder du webbappen</h3>
              <ol className="space-y-4 list-none p-0">
                {[
                  'Öppna webbappen via länken ni fått.',
                  'Skapa ett användarkonto med ditt tilltalsnamn.',
                  'Navigera till "Tippa matcher".',
                  'Fyll i dina tips innan Deadline.',
                  'Spara dina resultat.',
                  'Följ leaderboarden och se vem som leder Poängjakten!'
                ].map((step, i) => (
                  <li key={i} className="flex gap-4 items-center">
                    <span className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-sm text-zinc-500">{i + 1}</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Så fyller du i resultat ✍️</h3>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 font-medium">Inför varje match tippar du:</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Slutresultat
                  </li>
                  <li className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Eventuell vinnare
                  </li>
                  <li className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Bonusfrågor (om sådana finns)
                  </li>
                </ul>
                <div className="text-xs space-y-2">
                  <p className="font-black uppercase tracking-widest text-zinc-400">Exempel:</p>
                  <div className="flex justify-between text-zinc-700 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-zinc-700 pb-1">
                    <span>Sverige – Brasilien</span>
                    <span className="text-indigo-600 dark:text-indigo-400">1–1</span>
                  </div>
                  <div className="flex justify-between text-zinc-700 dark:text-zinc-300 font-bold">
                    <span>Argentina – Frankrike</span>
                    <span className="text-indigo-600 dark:text-indigo-400">2–1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-3xl">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-amber-600" />
              <h3 className="font-black uppercase tracking-widest text-amber-600">Poängsystem (exempel)</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-amber-700 dark:text-amber-500">Rätt vinnare</p>
                <p className="text-sm font-medium text-amber-600/80">XX poäng</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-amber-700 dark:text-amber-500">Rätt resultat</p>
                <p className="text-sm font-medium text-amber-600/80">XX poäng</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-amber-700 dark:text-amber-500">Bonusfråga</p>
                <p className="text-sm font-medium text-amber-600/80">Extra poäng</p>
              </div>
            </div>
            <p className="mt-8 text-center text-amber-700 dark:text-amber-500 font-bold italic">
              "Kom ihåg att alla tips måste vara registrerade innan Deadline!"
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-zinc-900 dark:bg-zinc-950 rounded-[32px] p-8 md:p-12 text-center text-white shadow-xl">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Frågor eller funderingar? 🙋</h2>
          <p className="text-zinc-400 font-medium max-w-xl mx-auto mb-8 text-lg">
            Har du problem med inloggning, resultatrapportering eller reglerna i Poängjakten?
          </p>
          <p className="text-indigo-400 font-black text-lg">
            Kontakta administratören eller skriv i gruppchatten så hjälper vi dig vidare.
          </p>
          <div className="mt-12 text-4xl font-black italic tracking-tighter text-white/20">
            Lycka till och må bästa fotbollsexpert vinna! ⚽🔥
          </div>
        </section>
      </div>
    </div>
  )
}
