import Link from "next/link";

import MovieCard from "@/components/movie-card";
import { getMovies } from "@/lib/movies";

export const metadata = {
  title: "내 영화 목록 | My Life Movie",
};

export default async function MoviesPage() {
  const movies = await getMovies();

  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* 헤더 */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">{"내 영화 목록"}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {"AI가 만들어준 나만의 인생 영화들"}
            </p>
          </div>
          <Link
            href="/movies/create"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-amber-300"
          >
            <span aria-hidden="true">{"+"}</span>
            {"새 영화 만들기"}
          </Link>
        </div>

        {movies.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-700 py-24 text-center">
            <p className="text-4xl">{"🎬"}</p>
            <p className="text-base font-medium text-zinc-300">
              {"아직 만들어진 영화가 없어요"}
            </p>
            <p className="text-sm text-zinc-500">
              {"나의 데이터를 업로드하고 첫 번째 인생 영화를 만들어보세요!"}
            </p>
            <Link
              href="/movies/create"
              className="mt-2 rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-amber-300"
            >
              {"영화 만들기"}
            </Link>
          </div>
        )}

        {movies.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
