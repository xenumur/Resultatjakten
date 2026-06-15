export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12">
      {/* Personalized Header Section Skeleton */}
      <div className="pt-6 md:pt-4">
        <div className="h-10 md:h-12 w-64 rounded-2xl mb-2 shimmer" />
        <div className="h-5 w-80 rounded-lg shimmer" />
      </div>

      {/* Introduction Button (Centered) Skeleton */}
      <div className="flex justify-center pb-2 pt-4">
        <div className="h-12 w-48 rounded-2xl shimmer" />
      </div>

      {/* Groups List Skeleton */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="h-7 w-36 rounded-lg shimmer" />
          <div className="h-6 w-20 rounded-full shimmer" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between min-h-[200px]"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl shimmer mb-6" />
                <div className="h-6 w-3/4 rounded-lg shimmer mb-2" />
                <div className="h-4 w-1/2 rounded-lg shimmer" />
              </div>
              <div className="flex items-center justify-between mt-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 shimmer" />
                  ))}
                </div>
                <div className="h-4 w-12 rounded shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="pt-4 space-y-6">
        <div className="h-4 w-28 rounded mx-auto shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-100 dark:border-zinc-800"
            >
              <div className="w-10 h-10 rounded-xl mb-3 shimmer" />
              <div className="h-3 w-16 rounded shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
