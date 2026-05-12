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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                Så använder du Skorio <span className="text-indigo-500">🚀</span>
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Gå med i en grupp', description: 'Använd din inbjudningskod för att ansluta till en privat grupp med vänner eller kollegor.' },
                  { title: 'Hitta matcherna', description: 'När du är i gruppen, klicka på dina aktiva spel för att se alla kommande matcher.' },
                  { title: 'Tippa resultaten', description: 'Navigera till "Tippa matcher" för att börja fylla i dina förutsägelser.' },
                  { title: 'Håll koll på deadline', description: 'Se till att skicka in dina tips i god tid innan matchen startar och systemet låses.' },
                  { title: 'Spara dina tips', description: 'Glöm inte att klicka på spara för att registrera dina resultat i poängjakten.' },
                  { title: 'Slutspelsträdet', description: 'Gissa vilka lag som tar sig hela vägen från åttondelsfinal till den stora finalen.' },
                  { title: 'Svara på bonusfrågor', description: 'Håll utkik efter kluriga bonusfrågor som kan ge dig det där lilla extra försprånget.' },
                  { title: 'Följ leaderboarden', description: 'Se din placering uppdateras live och tävla om förstaplatsen i gruppen!' }
                ].map((step, i) => (
                  <div key={i} className="flex gap-5 group">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        {i + 1}
                      </div>
                      {i < 7 && <div className="w-0.5 h-full bg-zinc-100 dark:bg-zinc-800 my-1" />}
                    </div>
                    <div className="pb-6">
                      <h4 className="text-lg font-bold text-zinc-900 dark:text-white leading-none mb-2">{step.title}</h4>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white">Så tippar du som ett proffs ✍️</h3>
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-[32px] p-8 border border-zinc-100 dark:border-zinc-800 space-y-6">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">Tre sätt att samla poäng:</h4>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">Matchtips</p>
                        <p className="text-xs text-zinc-500">Tippa slutresultatet i varje match. Du får poäng för rätt vinnare och extra mycket för exakt resultat.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">Slutspelstips</p>
                        <p className="text-xs text-zinc-500">Gissa vilka lag som tar sig vidare i turneringsträdet, hela vägen till finalen.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">Bonusfrågor</p>
                        <p className="text-xs text-zinc-500">Svara på specialfrågor i gruppen. Dessa rättas oftast efter att hela turneringen är avslutad.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Exempel på tips:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-400 mb-1">Gruppspel</p>
                      <p className="text-xs font-black text-zinc-900 dark:text-white flex justify-between">
                        <span>Sverige – Brasilien</span>
                        <span className="text-indigo-600">1–1</span>
                      </p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-400 mb-1">Slutspelstips</p>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">Semifinalister:</p>
                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 leading-tight">
                          Argentina, Brasilien, Portugal, Spanien
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 p-10 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/5 border border-amber-200 dark:border-amber-900/30 rounded-[40px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <HelpCircle className="w-32 h-32 text-amber-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-200 dark:bg-amber-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-800 dark:text-white" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-amber-800 dark:text-amber-500">Poängsystem & Regler</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <p className="text-3xl font-black text-amber-900 dark:text-amber-400">7p</p>
                  <p className="text-sm font-bold text-amber-800/60 dark:text-amber-500/60 uppercase tracking-widest">Exakt resultat</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-amber-900 dark:text-amber-400">2-3p</p>
                  <p className="text-sm font-bold text-amber-800/60 dark:text-amber-500/60 uppercase tracking-widest">Rätt vinnare/oavgjort</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-amber-900 dark:text-amber-400">Valfritt</p>
                  <p className="text-sm font-bold text-amber-800/60 dark:text-amber-500/60 uppercase tracking-widest">Bonusfrågor</p>
                </div>
              </div>
              <p className="mt-10 text-amber-900/70 dark:text-amber-500/70 font-bold italic border-t border-amber-200 dark:border-amber-900/20 pt-6">
                "Kom ihåg: Alla tips måste vara sparade innan matchens deadline. Inga undantag!"
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-zinc-950 rounded-[40px] p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/20 to-transparent -z-10" />
          <div className="w-20 h-20 bg-white/5 rounded-[24px] flex items-center justify-center mx-auto mb-8 border border-white/10">
            <MessageSquare className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-6">Frågor eller funderingar? 🙋</h2>
          <p className="text-zinc-400 font-medium max-w-2xl mx-auto mb-10 text-lg leading-relaxed">
            Har du problem med inloggning, resultatrapportering eller reglerna i Poängjakten? 
            Kontakta din administratör eller skriv i gruppchatten så hjälper vi dig vidare.
          </p>
          <div className="text-5xl md:text-6xl font-black italic tracking-tighter text-white/10 uppercase select-none">
            Må bästa expert vinna! ⚽🔥
          </div>
        </section>
      </div>
    </div>
  )
}
