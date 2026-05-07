export default function MoviesLoading() {
  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* 헤더 스켈레톤 */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-7 w-36 animate-pulse rounded-lg bg-zinc-700" />
            <div className="h-4 w-52 animate-pulse rounded-lg bg-zinc-800" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-xl bg-zinc-700" />
        </div>

        {/* 카드 스켈레톤 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-xl bg-zinc-800">
              <div className="aspect-[2/3] w-full animate-pulse bg-zinc-700" />
              <div className="flex flex-col gap-3 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-700" />
                <div className="mt-auto flex gap-2">
                  <div className="h-7 flex-1 animate-pulse rounded-lg bg-zinc-700" />
                  <div className="h-7 flex-1 animate-pulse rounded-lg bg-zinc-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
