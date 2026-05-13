"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import MovieActions from "@/components/movie-actions";
import { isUnauthenticatedError } from "@/features/auth/errors";
import { getMovie } from "@/lib/movies";
import { APP_ROUTES } from "@/lib/routes";
import type { Movie, SimilarMovie } from "@/types/movie";

type MovieDetailState =
  | { status: "loading" }
  | { status: "ready"; movie: Movie }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

export function MovieDetailClient({ movieId }: { movieId: number }) {
  const [state, setState] = useState<MovieDetailState>({ status: "loading" });

  useEffect(() => {
    let ignore = false;

    getMovie(movieId)
      .then((movie) => {
        if (!ignore) {
          setState({ status: "ready", movie });
        }
      })
      .catch((error: unknown) => {
        if (ignore) {
          return;
        }

        if (isUnauthenticatedError(error)) {
          setState({ status: "unauthenticated" });
          return;
        }

        if (isNotFoundError(error)) {
          setState({ status: "not_found" });
          return;
        }

        setState({ status: "error" });
      });

    return () => {
      ignore = true;
    };
  }, [movieId]);

  if (state.status === "loading") {
    return <StateView title="영화 정보를 불러오는 중입니다." />;
  }

  if (state.status === "unauthenticated") {
    return (
      <StateView
        title="로그인이 필요합니다"
        description="영화 상세 정보를 보려면 먼저 로그인해주세요."
        actionHref={`${APP_ROUTES.auth.login}?next=${encodeURIComponent(`/movies/${movieId}`)}`}
        actionLabel="로그인으로 이동"
      />
    );
  }

  if (state.status === "not_found") {
    return (
      <StateView
        title="영화를 찾을 수 없습니다"
        description="삭제되었거나 접근 권한이 없는 영화입니다."
        actionHref={APP_ROUTES.movies}
        actionLabel="목록으로 이동"
      />
    );
  }

  if (state.status === "error") {
    return (
      <StateView
        title="영화 정보를 불러오지 못했습니다"
        description="잠시 후 다시 시도해주세요."
        actionHref={APP_ROUTES.movies}
        actionLabel="목록으로 이동"
      />
    );
  }

  return <MovieDetail movie={state.movie} />;
}

function MovieDetail({ movie }: { movie: Movie }) {
  return (
    <div className="flex flex-col min-h-full">
      <div
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: "1px solid rgba(251,191,36,0.12)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={APP_ROUTES.movies}
            className="text-sm text-zinc-500 transition-colors hover:text-amber-400"
          >
            ←
          </Link>
          <div className="h-4 w-px bg-zinc-700" />
          <h1 className="text-lg font-bold text-zinc-50">{movie.title}</h1>
        </div>
        <MovieActions movieId={movie.id} movieTitle={movie.title} />
      </div>

      <div className="flex-1 px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(280px,520px)_1fr]">
          <MoviePreview movie={movie} />
          <MovieInfo movie={movie} />
        </div>

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
                <SimilarMovieCard key={`${similar.provider}-${similar.id}`} movie={similar} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SimilarMovieCard({ movie }: { movie: SimilarMovie }) {
  const content = (
    <>
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {movie.thumbnail ? (
          <Image
            src={movie.thumbnail}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-950 px-3 text-center text-xs text-zinc-500">
            포스터 준비 중
          </div>
        )}
        {movie.provider === "tmdb" && (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            TMDB
          </span>
        )}
      </div>
      <p className="line-clamp-2 p-3 text-xs font-medium leading-snug text-zinc-300 transition-colors group-hover:text-amber-400">
        {movie.title}
      </p>
    </>
  );

  const className = "group flex flex-col overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1.5";
  const style = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(8px)",
  };

  if (movie.externalUrl) {
    return (
      <a
        href={movie.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <article className={className} style={style}>
      {content}
    </article>
  );
}

function MoviePreview({ movie }: { movie: Movie }) {
  if (movie.outputUrl) {
    return (
      <div className="w-full">
        <video
          src={movie.outputUrl}
          poster={movie.thumbnail}
          controls
          playsInline
          className="aspect-video w-full rounded-xl bg-black object-contain"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
        />
      </div>
    );
  }

  if (movie.thumbnail) {
    return (
      <div
        className="relative aspect-[2/3] w-56 max-w-full overflow-hidden rounded-xl"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(251,191,36,0.08)" }}
      >
        <Image
          src={movie.thumbnail}
          alt={movie.title}
          fill
          sizes="224px"
          className="object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-950 text-sm text-zinc-500"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      영상 미리보기가 아직 준비되지 않았습니다.
    </div>
  );
}

function MovieInfo({ movie }: { movie: Movie }) {
  return (
    <div className="flex flex-col gap-6">
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
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold text-zinc-300"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {formatMovieStatus(movie.status)}
        </span>
      </div>

      <InfoSection title="줄거리">
        <p className="text-sm leading-7 text-zinc-300">{movie.description}</p>
      </InfoSection>

      {movie.ost.length > 0 && (
        <InfoSection title="OST">
          <ul className="flex flex-col gap-2">
            {movie.ost.map((track, i) => (
              <li key={`${track.title}-${i}`}>
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
                    <span className="text-base">♪</span>
                    <span className="font-medium text-zinc-100">{track.title}</span>
                    <span className="text-zinc-500">- {track.artist}</span>
                    <span className="ml-auto text-xs text-green-400 font-medium">Spotify</span>
                  </a>
                ) : (
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span className="text-base">♪</span>
                    <span className="font-medium text-zinc-100">{track.title}</span>
                    <span className="text-zinc-500">- {track.artist}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </InfoSection>
      )}
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px w-4 bg-amber-400/50" />
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/70">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function StateView({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-full items-center justify-center px-8 py-16">
      <section className="max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-center">
        <h1 className="text-base font-semibold text-zinc-50">{title}</h1>
        {description && (
          <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
        )}
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-amber-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
          >
            {actionLabel}
          </Link>
        )}
      </section>
    </div>
  );
}

function formatMovieStatus(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "완성";
    case "GENERATING":
      return "생성 중";
    case "FAILED":
      return "실패";
    default:
      return "초안";
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "problem" in error &&
    (error as { problem?: { status?: number } }).problem?.status === 404
  );
}
