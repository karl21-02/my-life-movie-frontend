import Link from "next/link";

import MovieCard from "@/components/movie-card";
import { getMovies } from "@/lib/movies";
import { APP_ROUTES } from "@/lib/routes";

export const metadata = {
  title: "내 영화 목록 | My Life Movie",
};

// 배경 별빛 오브젝트
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
      {/* 조명 스포트라이트 */}
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
      {/* 우측 상단 달빛 느낌 */}
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

export default async function MoviesPage() {
  const movies = await getMovies();

  return (
    <div className="relative px-8 py-10 min-h-screen">
      <StarField />

      {/* 헤더 */}
      <div className="relative z-10 mb-8 flex items-end justify-between">
        <div>
          {/* 장식 라인 + 라벨 */}
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

      {/* 구분선 */}
      <div className="relative z-10 mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-amber-400/30 via-blue-400/20 to-transparent" />
        <span className="text-amber-400/40 text-xs">✦</span>
        <div className="h-px w-12 bg-amber-400/20" />
      </div>

      {/* 빈 상태 */}
      {movies.length === 0 && (
        <div
          className="relative z-10 flex flex-col items-center justify-center gap-4 rounded-2xl py-24 text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(251,191,36,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <p className="text-5xl">🎬</p>
          <p className="text-base font-semibold text-zinc-200">
            아직 만들어진 영화가 없어요
          </p>
          <p className="text-sm text-zinc-500">
            나의 데이터를 업로드하고 첫 번째 인생 영화를 만들어보세요!
          </p>
          <Link
            href={APP_ROUTES.createMovie}
            className="mt-2 rounded-xl px-5 py-2.5 text-sm font-bold text-zinc-900 transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              boxShadow: "0 4px 20px rgba(251,191,36,0.3)",
            }}
          >
            영화 만들기
          </Link>
        </div>
      )}

      {/* 영화 그리드 */}
      {movies.length > 0 && (
        <div className="relative z-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
