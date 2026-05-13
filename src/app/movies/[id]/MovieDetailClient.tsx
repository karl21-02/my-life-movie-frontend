"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import MovieActions from "@/components/movie-actions";
import { isUnauthenticatedError } from "@/features/auth/errors";
import { getGenerationStatus, getMovie } from "@/lib/movies";
import { APP_ROUTES } from "@/lib/routes";
import type { GenerationStatus, Movie, SimilarMovie } from "@/types/movie";

const GENERATION_POLL_INTERVAL_MS = 5000;

type MovieDetailState =
  | { status: "loading" }
  | { status: "ready"; movie: Movie }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

export function MovieDetailClient({ movieId }: { movieId: number }) {
  const [state, setState] = useState<MovieDetailState>({ status: "loading" });
  const [generation, setGeneration] = useState<GenerationStatus | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadMovie() {
      try {
        const movie = await getMovie(movieId);
        if (!ignore) {
          setState({ status: "ready", movie });
          if (shouldFetchGenerationStatus(movie.status)) {
            loadGenerationStatus();
          }
        }
      } catch (error) {
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
      }
    }

    async function loadGenerationStatus() {
      try {
        const nextGeneration = await getGenerationStatus(movieId);
        if (!ignore) {
          setGeneration(nextGeneration);
        }
      } catch {
        if (!ignore) {
          setGeneration(null);
        }
      }
    }

    loadMovie();

    return () => {
      ignore = true;
    };
  }, [movieId]);

  useEffect(() => {
    if (state.status !== "ready" || !isGenerationInProgress(state.movie.status)) {
      return;
    }

    let ignore = false;

    async function pollGeneration() {
      try {
        const nextGeneration = await getGenerationStatus(movieId);
        if (ignore) {
          return;
        }

        setGeneration(nextGeneration);

        if (isTerminalGenerationStatus(nextGeneration.status)) {
          const nextMovie = await getMovie(movieId);
          if (!ignore) {
            setState({ status: "ready", movie: nextMovie });
          }
        }
      } catch {
        // 상태 폴링 실패는 다음 주기에서 다시 시도합니다.
      }
    }

    pollGeneration();
    const intervalId = window.setInterval(pollGeneration, GENERATION_POLL_INTERVAL_MS);

    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, [movieId, state]);

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

  return <MovieDetail movie={state.movie} generation={generation} />;
}

function MovieDetail({
  movie,
  generation,
}: {
  movie: Movie;
  generation: GenerationStatus | null;
}) {
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
          <MoviePreview movie={movie} generation={generation} />
          <MovieInfo movie={movie} generation={generation} />
        </div>

        {movie.similarMovies.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-4 bg-amber-400/50" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/70">
                비슷한 영화 추천
              </h2>
              {movie.similarMovies.some((similar) => similar.provider === "tmdb") && (
                <a
                  href="https://www.themoviedb.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-medium text-zinc-500 transition-colors hover:text-amber-300"
                >
                  영화 정보 제공: TMDB
                </a>
              )}
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

function MoviePreview({
  movie,
  generation,
}: {
  movie: Movie;
  generation: GenerationStatus | null;
}) {
  if (isGenerationInProgress(generation?.status ?? movie.status)) {
    return (
      <GenerationStatePanel
        title="영상을 생성하고 있습니다"
        description="AI가 스토리와 장면 구성을 바탕으로 영상을 만들고 있습니다."
        progress={generation?.progress ?? 1}
        tone="progress"
      />
    );
  }

  if (isGenerationFailed(generation?.status ?? movie.status)) {
    return (
      <GenerationStatePanel
        title="영상 생성에 실패했습니다"
        description={formatGenerationError(generation)}
        progress={generation?.progress ?? 0}
        tone="failed"
      />
    );
  }

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

function MovieInfo({
  movie,
  generation,
}: {
  movie: Movie;
  generation: GenerationStatus | null;
}) {
  const displayedStatus = generation?.status ?? movie.status;

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
          {formatMovieStatus(displayedStatus)}
        </span>
        {isGenerationInProgress(displayedStatus) && (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-amber-200"
            style={{
              background: "rgba(251,191,36,0.10)",
              border: "1px solid rgba(251,191,36,0.24)",
            }}
          >
            {generation?.progress ?? 1}%
          </span>
        )}
        {isGenerationFailed(displayedStatus) && generation?.errorCode && (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-red-200"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.24)",
            }}
          >
            {formatGenerationErrorCode(generation.errorCode)}
          </span>
        )}
      </div>

      {(isGenerationInProgress(displayedStatus) || isGenerationFailed(displayedStatus)) && (
        <InfoSection title="생성 상태">
          <p className="text-sm leading-7 text-zinc-300">
            {isGenerationFailed(displayedStatus)
              ? formatGenerationError(generation)
              : `현재 ${generation?.progress ?? 1}% 진행 중입니다. 완료되면 이 화면에 자동 반영됩니다.`}
          </p>
        </InfoSection>
      )}

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
    case "SUCCEEDED":
      return "완성";
    case "GENERATING":
    case "QUEUED":
    case "RUNNING":
      return "생성 중";
    case "FAILED":
      return "실패";
    case "CANCELED":
      return "취소";
    default:
      return "초안";
  }
}

function GenerationStatePanel({
  title,
  description,
  progress,
  tone,
}: {
  title: string;
  description: string;
  progress: number;
  tone: "progress" | "failed";
}) {
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const isFailed = tone === "failed";

  return (
    <div
      className="flex aspect-video w-full flex-col justify-center rounded-xl bg-zinc-950 p-8"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-sm font-bold ${isFailed ? "text-red-300" : "text-amber-300"}`}>
            {title}
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
        </div>
        {!isFailed && (
          <span className="shrink-0 text-2xl font-bold text-amber-300">
            {normalizedProgress}%
          </span>
        )}
      </div>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${isFailed ? "bg-red-500" : "bg-amber-400"}`}
          style={{ width: `${isFailed ? 100 : normalizedProgress}%` }}
        />
      </div>
    </div>
  );
}

function shouldFetchGenerationStatus(status: string): boolean {
  return isGenerationInProgress(status) || isGenerationFailed(status);
}

function isGenerationInProgress(status: string): boolean {
  return status === "GENERATING" || status === "QUEUED" || status === "RUNNING";
}

function isGenerationFailed(status: string): boolean {
  return status === "FAILED";
}

function isTerminalGenerationStatus(status: string): boolean {
  return status === "SUCCEEDED" || status === "FAILED" || status === "CANCELED";
}

function formatGenerationError(generation: GenerationStatus | null): string {
  if (!generation?.errorCode && !generation?.errorMessage) {
    return "영상 생성 중 오류가 발생했습니다. 입력 내용을 조정한 뒤 다시 생성해주세요.";
  }

  if (generation.errorCode === "PROVIDER_MODERATION_BLOCKED") {
    return "영상 provider의 안전성 검토에서 차단되었습니다. 인물/상황 표현을 더 일반적이고 안전하게 바꾼 뒤 다시 생성해주세요.";
  }

  if (generation.errorCode === "PROVIDER_TIMEOUT") {
    return "영상 provider 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
  }

  return generation.errorMessage ?? "영상 생성 중 오류가 발생했습니다.";
}

function formatGenerationErrorCode(errorCode: string): string {
  switch (errorCode) {
    case "PROVIDER_MODERATION_BLOCKED":
      return "안전성 차단";
    case "PROVIDER_TIMEOUT":
      return "시간 초과";
    default:
      return "provider 오류";
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
