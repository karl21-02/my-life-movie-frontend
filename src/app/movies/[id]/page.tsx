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
      <div
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: "1px solid rgba(251,191,36,0.12)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/movies"
            className="text-sm text-zinc-500 transition-colors hover:text-amber-400"
          >
            ←
          </Link>
          <div className="h-4 w-px bg-zinc-700" />
          <h1 className="text-lg font-bold text-zinc-50">{movie.title}</h1>
        </div>
        <MovieActions movieId={movie.id} movieTitle={movie.title} />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 px-8 py-8">
        {/* 포스터 + 정보 */}
        <div className="flex gap-8">
          {/* 포스터 */}
          <div
            className="relative aspect-[2/3] w-48 flex-shrink-0 overflow-hidden rounded-xl"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(251,191,36,0.08)" }}
          >
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
          <div className="flex flex-1 flex-col gap-6">
            {/* 장르 & 감성 뱃지 */}
            <div className="flex flex-wrap gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold text-zinc-900 tracking-wide"
                style={{
                  background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                  boxShadow: "0 2px 8px rgba(251,191,36,0.35)",
                }}
              >
                {movie.genre}
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-blue-200"
                style={{
                  background: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.25)",
                }}
              >
                {movie.sentiment}
              </span>
            </div>

            {/* 줄거리 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px w-4 bg-amber-400/50" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/70">
                  줄거리
                </h2>
              </div>
              <p className="text-sm leading-7 text-zinc-300">{movie.description}</p>
            </div>

            {/* OST */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-4 bg-amber-400/50" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/70">
                  OST
                </h2>
              </div>
              <ul className="flex flex-col gap-2">
                {movie.ost.map((track, i) => (
                  <li key={i}>
                    {track.spotifyUrl ? (
                      <a
                        href={track.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all hover:scale-[1.01]"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        <span className="text-base">🎵</span>
                        <span className="font-medium text-zinc-100">{track.title}</span>
                        <span className="text-zinc-500">— {track.artist}</span>
                        <span className="ml-auto text-xs text-green-400 font-medium">Spotify ↗</span>
                      </a>
                    ) : (
                      <div
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <span className="text-base">🎵</span>
                        <span className="font-medium text-zinc-100">{track.title}</span>
                        <span className="text-zinc-500">— {track.artist}</span>
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
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-4 bg-amber-400/50" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/70">
                비슷한 영화 추천
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-amber-400/20 to-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {movie.similarMovies.map((similar) => (
                <Link
                  key={similar.id}
                  href={`/movies/${similar.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1.5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden">
                    <Image
                      src={similar.thumbnail}
                      alt={similar.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <p className="line-clamp-2 p-3 text-xs font-medium leading-snug text-zinc-300 transition-colors group-hover:text-amber-400">
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
