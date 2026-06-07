export default function MovieDetailLoading() {
  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* 뒤로가기 스켈레톤 */}
        <div className="mb-8 h-4 w-24 animate-pulse rounded bg-zinc-700" />

        {/* 메인 영역 */}
        <div className="flex flex-col gap-8 sm:flex-row">
          {/* 포스터 스켈레톤 */}
          <div className="mx-auto aspect-[2/3] w-56 flex-shrink-0 animate-pulse rounded-2xl bg-zinc-700 sm:mx-0 sm:w-64" />

          {/* 텍스트 스켈레톤 */}
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex gap-2">
              <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-700" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-700" />
            </div>
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-zinc-700" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-zinc-800" />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <div className="h-10 animate-pulse rounded-lg bg-zinc-800" />
              <div className="h-10 animate-pulse rounded-lg bg-zinc-800" />
            </div>
            <div className="mt-auto flex gap-3">
              <div className="h-10 w-28 animate-pulse rounded-xl bg-zinc-700" />
              <div className="h-10 w-20 animate-pulse rounded-xl bg-zinc-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
