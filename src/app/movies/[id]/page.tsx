import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import MovieActions from "@/components/movie-actions";
import { getMovie } from "@/lib/movies";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const movie = await getMovie(Number(id)).catch(() => null);
  return {
    title: movie ? `${movie.title} | My Life Movie` : "영화 상세 | My Life Movie",
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params;
  const movieId = Number(id);

  if (isNaN(movieId)) notFound();

  const movie = await getMovie(movieId).catch(() => null);
  if (!movie) notFound();

  return (
    <div className="flex flex-col min-h-full">
      {/* 상단 타이틀 바 */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-8 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/movies"
            className="text-sm text-zinc-400 transition-colors hover:text-amber-400"
          >
            {"←"}
          </Link>
          <h1 className="text-lg font-bold text-zinc-50">{movie.title}</h1>
        </div>
        <MovieActions movieId={movie.id} movieTitle={movie.title} />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 px-8 py-8">
        {/* 포스터 + 정보 */}
        <div className="flex gap-8">
          {/* 포스터 */}
          <div className="relative aspect-[2/3] w-48 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl">
            <Image
              src={movie.thumbnail}
              alt={movie.title}
              fill
              sizes="192px"
              className="object-cover"
              priority
            />
          </div>

          {/* 텍스트 정보 */}
          <div className="flex flex-1 flex-col gap-5">
            {/* 장르 & 감성 뱃지 */}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-zinc-900">
                {movie.genre}
              </span>
              <span className="rounded-full bg-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-200">
                {movie.sentiment}
              </span>
            </div>

            {/* 줄거리 */}
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {"줄거리"}
              </h2>
              <p className="text-sm leading-7 text-zinc-300">{movie.description}</p>
            </div>

            {/* OST */}
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {"OST"}
              </h2>
              <ul className="flex flex-col gap-2">
                {movie.ost.map((track, i) => (
                  <li key={i}>
                    {track.spotifyUrl ? (
                      <a
                        href={track.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm transition-colors hover:bg-zinc-700"
                      >
                        <span className="text-base">{"🎵"}</span>
                        <span className="font-medium text-zinc-100">{track.title}</span>
                        <span className="text-zinc-400">{"— "}{track.artist}</span>
                        <span className="ml-auto text-xs text-green-400">{"Spotify ↗"}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2.5 text-sm">
                        <span className="text-base">{"🎵"}</span>
                        <span className="font-medium text-zinc-100">{track.title}</span>
                        <span className="text-zinc-400">{"— "}{track.artist}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 비슷한 영화 추천 */}
        {movie.similarMovies.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {"비슷한 영화 추천"}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {movie.similarMovies.map((similar) => (
                <Link
                  key={similar.id}
                  href={`/movies/${similar.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl bg-zinc-800 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-700">
                    <Image
                      src={similar.thumbnail}
                      alt={similar.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="line-clamp-2 p-3 text-xs font-medium leading-snug text-zinc-200 transition-colors group-hover:text-amber-400">
                    {similar.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
