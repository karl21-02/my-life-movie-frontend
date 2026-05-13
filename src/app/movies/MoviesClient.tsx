"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import MovieCard from "@/components/movie-card";
import { isUnauthenticatedError } from "@/features/auth/errors";
import { getMovies } from "@/lib/movies";
import { APP_ROUTES } from "@/lib/routes";
import type { MovieSummary } from "@/types/movie";

type MoviesState =
  | { status: "loading" }
  | { status: "ready"; movies: MovieSummary[] }
  | { status: "unauthenticated" }
  | { status: "error" };

export function MoviesClient() {
  const [state, setState] = useState<MoviesState>({ status: "loading" });

  useEffect(() => {
    let ignore = false;

    function loadMovies() {
      getMovies()
        .then((movies) => {
          if (!ignore) {
            setState({ status: "ready", movies });
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

          setState((previous) => previous.status === "ready" ? previous : { status: "error" });
        });
    }

    loadMovies();
    const intervalId = window.setInterval(() => {
      loadMovies();
    }, 5000);

    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, []);

  function handleMovieDeleted(movieId: number) {
    setState((previous) => {
      if (previous.status !== "ready") {
        return previous;
      }
      return {
        status: "ready",
        movies: previous.movies.filter((movie) => movie.id !== movieId),
      };
    });
  }

  return (
    <div className="relative px-8 py-10 min-h-screen">
      <StarField />
      <MoviesHeader />
      <Divider />
      <MoviesContent state={state} onMovieDeleted={handleMovieDeleted} />
    </div>
  );
}

function MoviesHeader() {
  return (
    <div className="relative z-10 mb-8 flex items-end justify-between">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px w-8 bg-amber-400/60" />
          <p className="text-xs font-bold tracking-[0.3em] text-amber-400/80 uppercase">
            Personal Cinema Archive
          </p>
        </div>
        <h1 className="text-3xl font-bold text-white" style={{ textShadow: "0 0 40px rgba(251,191,36,0.2)" }}>
          내 영화 목록
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          AI가 만들어준 나만의 인생 영화들
        </p>
      </div>
      <Link
        href={APP_ROUTES.createMovie}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-zinc-900 transition-all hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
          boxShadow: "0 4px 20px rgba(251,191,36,0.35)",
        }}
      >
        <span aria-hidden="true">✦</span>
        새 영화 만들기
      </Link>
    </div>
  );
}

function MoviesContent({
  state,
  onMovieDeleted,
}: {
  state: MoviesState;
  onMovieDeleted: (movieId: number) => void;
}) {
  if (state.status === "loading") {
    return <StatePanel title="영화 목록을 불러오는 중입니다." />;
  }

  if (state.status === "unauthenticated") {
    return (
      <StatePanel
        title="로그인이 필요합니다"
        description="내가 만든 영화를 보려면 먼저 로그인해주세요."
        actionHref={`${APP_ROUTES.auth.login}?next=${encodeURIComponent(APP_ROUTES.movies)}`}
        actionLabel="로그인으로 이동"
      />
    );
  }

  if (state.status === "error") {
    return (
      <StatePanel
        title="영화 목록을 불러오지 못했습니다"
        description="잠시 후 다시 시도해주세요."
      />
    );
  }

  if (state.movies.length === 0) {
    return (
      <StatePanel
        title="아직 만들어진 영화가 없어요"
        description="나의 데이터를 업로드하고 첫 번째 인생 영화를 만들어보세요."
        actionHref={APP_ROUTES.createMovie}
        actionLabel="영화 만들기"
      />
    );
  }

  return (
    <div className="relative z-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {state.movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onDeleted={onMovieDeleted} />
      ))}
    </div>
  );
}

function StatePanel({
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
    <div
      className="relative z-10 flex flex-col items-center justify-center gap-4 rounded-2xl py-24 text-center"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px dashed rgba(251,191,36,0.2)",
        backdropFilter: "blur(8px)",
      }}
    >
      <p className="text-5xl" aria-hidden="true">🎬</p>
      <p className="text-base font-semibold text-zinc-200">{title}</p>
      {description && <p className="text-sm text-zinc-500">{description}</p>}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-2 rounded-xl px-5 py-2.5 text-sm font-bold text-zinc-900 transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
            boxShadow: "0 4px 20px rgba(251,191,36,0.3)",
          }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div className="relative z-10 mb-8 flex items-center gap-4">
      <div className="h-px flex-1 bg-gradient-to-r from-amber-400/30 via-blue-400/20 to-transparent" />
      <span className="text-amber-400/40 text-xs">✦</span>
      <div className="h-px w-12 bg-amber-400/20" />
    </div>
  );
}

function StarField() {
  const stars = [
    { top: "8%", left: "12%", size: 3, opacity: 0.8 },
    { top: "5%", left: "40%", size: 2, opacity: 0.6 },
    { top: "12%", left: "68%", size: 4, opacity: 0.9 },
    { top: "3%", left: "85%", size: 2, opacity: 0.5 },
    { top: "20%", left: "92%", size: 3, opacity: 0.7 },
    { top: "30%", left: "5%", size: 2, opacity: 0.5 },
    { top: "45%", left: "95%", size: 2, opacity: 0.4 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            boxShadow: `0 0 ${s.size * 3}px ${s.size}px rgba(255,255,255,0.3)`,
          }}
        />
      ))}
      <div
        className="absolute"
        style={{
          top: "-20%",
          left: "30%",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(ellipse, rgba(251,191,36,0.08) 0%, transparent 70%)",
          transform: "rotate(-15deg)",
          pointerEvents: "none",
        }}
      />
      <div
        className="absolute"
        style={{
          top: "-60px",
          right: "80px",
          width: "200px",
          height: "200px",
          background:
            "radial-gradient(circle, rgba(200,220,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
