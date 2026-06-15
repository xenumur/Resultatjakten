export default function GameLoading() {
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12">
      {/* Back link */}
      <div className="h-4 w-32 rounded shimmer mb-8" />

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
        <div className="space-y-3">
          <div className="h-10 md:h-12 w-64 rounded-2xl shimmer" />
          <div className="h-5 w-48 rounded shimmer" />
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="h-10 w-20 sm:w-24 rounded-xl sm:rounded-2xl shimmer" />
          <div className="h-10 w-28 sm:w-32 rounded-xl sm:rounded-2xl shimmer" />
          <div className="h-10 w-32 sm:w-36 rounded-xl sm:rounded-2xl shimmer" />
        </div>
      </div>

      {/* MatchTabs Skeleton */}
      <div className="space-y-6">
        {/* Tab Bar Skeleton */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-2xl w-fit">
          <div className="h-10 w-28 rounded-xl shimmer" />
          <div className="h-10 w-24 rounded-xl shimmer" />
        </div>

        {/* Group Section Skeleton */}
        <div className="space-y-8">
          {[1, 2].map((groupIndex) => (
            <div
              key={groupIndex}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm"
            >
              {/* Group Header */}
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="h-5 w-24 rounded shimmer" />
                <div className="h-4 w-16 rounded shimmer" />
              </div>

              {/* Match Items List */}
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[1, 2, 3].map((matchIndex) => (
                  <li
                    key={matchIndex}
                    className="p-4 md:p-6 flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:justify-between gap-4"
                  >
                    {/* Left side info */}
                    <div className="flex flex-col items-center md:items-start w-full md:w-auto space-y-3">
                      {/* Meta line */}
                      <div className="h-4 w-52 rounded shimmer" />
                      {/* Teams display */}
                      <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4">
                        <div className="h-5 w-24 rounded shimmer text-right" />
                        <div className="h-6 w-8 rounded shimmer shrink-0" />
                        <div className="h-5 w-24 rounded shimmer text-left" />
                      </div>
                      {/* Tip prediction box skeleton */}
                      <div className="h-6 w-32 rounded-xl shimmer" />
                    </div>

                    {/* Right side info (status/score) */}
                    <div className="h-8 w-24 rounded-full shimmer shrink-0" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
