import { Calendar, Clock, Coins, Medal, Tv } from 'lucide-react'

export default function GroupLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:px-10 md:py-12 flex flex-col gap-10 md:gap-16 overflow-x-hidden">
      {/* Header Skeleton */}
      <div className="order-1 flex flex-col md:flex-row md:items-end justify-between gap-8 text-center md:text-left">
        <div className="space-y-3 min-w-0">
          <div className="h-4 w-28 rounded shimmer mx-auto md:mx-0" />
          <div className="h-10 md:h-16 w-80 max-w-full rounded-2xl shimmer mx-auto md:mx-0" />
          <div className="h-5 w-96 max-w-full rounded-lg shimmer mx-auto md:mx-0" />
        </div>
        <div className="flex flex-row justify-center md:justify-end gap-2 sm:gap-3 shrink-0">
          <div className="h-10 w-24 sm:w-28 rounded-xl sm:rounded-2xl shimmer" />
          <div className="h-10 w-32 sm:w-36 rounded-xl sm:rounded-2xl shimmer" />
        </div>
      </div>

      {/* Upcoming Matches Horizontal Scroll Widget Skeleton */}
      <div className="order-2 space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Clock className="w-4 h-4 text-zinc-300 dark:text-zinc-700" />
          <div className="h-4 w-36 rounded shimmer" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none shrink-0">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 min-w-[280px] max-w-[320px] flex-1 shadow-sm shrink-0"
            >
              <div className="flex flex-col gap-2 flex-1 pr-3">
                <div className="h-4 w-24 rounded shimmer" />
                <div className="h-4 w-20 rounded shimmer" />
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="h-4 w-16 rounded shimmer" />
                <div className="h-5 w-12 rounded shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prize Pool Summary Skeleton */}
      <section className="order-4 md:order-3 space-y-6">
        <div className="flex items-center justify-center md:justify-start gap-2">
          <Coins className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
          <div className="h-6 w-48 rounded shimmer" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl min-h-[140px] md:min-h-[160px] flex flex-col justify-between">
            <div className="h-3 w-24 rounded shimmer" />
            <div className="h-8 w-40 rounded shimmer mt-6" />
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl min-h-[140px] md:min-h-[160px] flex flex-col justify-between">
            <div className="h-3 w-24 rounded shimmer" />
            <div className="space-y-3 mt-4">
              <div className="h-5 w-full rounded shimmer" />
              <div className="h-5 w-full rounded shimmer" />
              <div className="h-5 w-full rounded shimmer" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Games & Leaderboard Skeleton */}
      <div className="order-3 md:order-4 grid lg:grid-cols-3 gap-10 md:gap-16">
        {/* Left Side: Active Games & Deadlines Skeleton */}
        <div className="lg:col-span-1 space-y-8 min-w-0 order-2 lg:order-1">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-6 w-32 rounded shimmer" />
            </div>
            <div className="space-y-4">
              <div className="h-20 rounded-3xl border border-zinc-200 dark:border-zinc-800 shimmer" />
              <div className="h-20 rounded-3xl border border-zinc-200 dark:border-zinc-800 shimmer" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 md:p-10 rounded-[32px] md:rounded-[40px] space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
              <div className="h-6 w-36 rounded shimmer" />
            </div>
            <div className="space-y-5">
              <div className="h-12 rounded shimmer" />
              <div className="h-12 rounded shimmer" />
            </div>
          </div>
        </div>

        {/* Right Side: Leaderboard Table Skeleton */}
        <div className="lg:col-span-2 space-y-6 min-w-0 order-1 lg:order-2">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
            <div className="h-6 w-36 rounded shimmer" />
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] md:rounded-[40px] overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="h-4 w-12 rounded shimmer" />
                <div className="h-4 w-24 rounded shimmer" />
                <div className="h-4 w-16 rounded shimmer" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full shimmer" />
                    <div className="w-9 h-9 rounded-xl shimmer hidden sm:block" />
                    <div className="space-y-1">
                      <div className="h-4 w-28 rounded shimmer" />
                      <div className="h-3 w-16 rounded shimmer" />
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="h-4 w-8 rounded shimmer hidden sm:block" />
                    <div className="h-5 w-10 rounded shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Group Info Skeleton */}
      <section style={{ order: 99 }} className="bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6 md:p-10 rounded-[32px] md:rounded-[40px] space-y-6">
        <div className="h-6 w-24 rounded shimmer" />
        <div className="space-y-4">
          <div className="h-6 rounded shimmer" />
          <div className="h-6 rounded shimmer" />
          <div className="h-6 rounded shimmer" />
        </div>
      </section>
    </div>
  )
}
