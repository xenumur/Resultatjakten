import Link from 'next/link'
import { Info, Trophy, CheckCircle2, HelpCircle, MessageSquare } from 'lucide-react'

export default function IntroductionPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-8">
      <Link href="/dashboard" className="group text-sm font-semibold text-zinc-500 hover:text-indigo-600 transition-colors flex items-center gap-2 mb-2">
        <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Tillbaka till Dashboard
      </Link>

      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-[32px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]" />
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              VM 2026 – Officiell Guide
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
              Välkommen till <br />
              <span className="text-indigo-200">Skorio</span> ⚽
            </h1>
            <p className="text-indigo-100 text-lg font-medium max-w-xl leading-relaxed opacity-90">
              Bemästra Skorio och tävla mot dina vänner i historiens största världsmästerskap. Här är allt du behöver veta.
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Instructions Card */}
            <section className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Så fungerar det</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {[
                  { title: 'Gå med', desc: 'Anslut till din grupp med inbjudningskod.' },
                  { title: 'Tippa matcher', desc: 'Fyll i dina förutsägelser innan deadline.' },
                  { title: 'Spara ofta', desc: 'Registrera tipsen för att delta i poängjakten.' },
                  { title: 'Tippa slutspel', desc: 'Gissa vinnarna hela vägen till finalen.' },
                  { title: 'Bonusfrågor', desc: 'Svara på kluriga frågor för extra poäng.' },
                  { title: 'Följ liven', desc: 'Se din placering uppdateras under turneringen.' }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center font-black text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">{step.title}</h4>
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Background Card */}
            <section className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">VM 2026</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                VM 2026 arrangeras i <strong>USA, Kanada och Mexiko</strong> och är det största någonsin med 48 nationer och 104 matcher. Finalen spelas den 19 juli 2026 i New York/New Jersey.
              </p>
            </section>
          </div>

          {/* Scoring Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-amber-50 dark:bg-amber-900/10 rounded-[32px] p-8 text-amber-900 dark:text-amber-100 relative overflow-hidden h-full border border-amber-200/50 dark:border-amber-900/30">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy className="w-24 h-24 text-amber-500" />
              </div>
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-amber-800 dark:text-amber-400">Poängsystem</h3>
                </div>

                <div className="space-y-6">
                  {/* Match Tips */}
                  <div className="p-4 bg-white dark:bg-zinc-900/50 rounded-2xl border border-amber-200/50 dark:border-amber-900/30 shadow-sm">
                    <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest mb-3">Matchtips</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-amber-900/70 dark:text-amber-200/70">Rätt vinnare</span>
                        <div className="flex items-baseline gap-1 w-24">
                          <span className="text-xl font-black text-amber-600">3p</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-amber-900/70 dark:text-amber-200/70">Rätt lagmål</span>
                        <div className="flex items-baseline gap-1 w-24">
                          <span className="text-xl font-black text-amber-600">2p</span>
                          <span className="text-[10px] text-amber-400 font-medium">/ lag</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Playoff Tips */}
                  <div className="p-4 bg-white dark:bg-zinc-900/50 rounded-2xl border border-amber-200/50 dark:border-amber-900/30 shadow-sm">
                    <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest mb-3">Tippa slutspel</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Åttondelsfinal', pts: '1p' },
                        { label: 'Kvartsfinal', pts: '2p' },
                        { label: 'Semifinal', pts: '4p' },
                        { label: 'Bronsmatch', pts: '8p' },
                        { label: 'Final', pts: '10p' }
                      ].map((round, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-amber-900/70 dark:text-amber-200/70">{round.label}</span>
                          <span className="font-black text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">{round.pts}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bonus */}
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200/50 dark:border-indigo-900/30 shadow-sm">
                    <p className="text-[10px] font-black text-indigo-600/60 uppercase tracking-widest mb-2">Bonusfrågor</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-indigo-600">5–20p</span>
                      <span className="text-[10px] text-indigo-400 font-medium">per svar</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-amber-200/50 dark:border-amber-900/20">
                  <p className="text-[10px] text-amber-800/40 dark:text-amber-400/40 font-bold italic uppercase tracking-wider text-center">
                    "Spara tipsen innan deadline"
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Contact Section */}
        <section className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 md:p-12 text-center border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-800">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Frågor? 🙋</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
              Problem med inloggning eller regler? Kontakta din administratör eller skriv i gruppchatten.
            </p>
            <div className="pt-4">
              <span className="px-8 py-3 bg-indigo-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                Må bästa expert vinna! ⚽🔥
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
