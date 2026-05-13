"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { logger } from "@/lib/logger";
import {
  deleteMovie,
  downloadMovie,
  getMovieDownloadFileUrl,
  shareMovie,
} from "@/lib/movies";
import type { MovieSummary } from "@/types/movie";

type Props = {
  movie: MovieSummary;
};

export default function MovieCard({ movie }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleShare() {
    setIsSharing(true);
    logger.info("movie_share_clicked", { movie_id: movie.id });
    try {
      const { share_url } = await shareMovie(movie.id);
      if (navigator.share) {
        await navigator.share({ title: movie.title, url: share_url });
      } else {
        await navigator.clipboard.writeText(share_url);
        showToast("링크가 복사되었습니다!");
      }
      logger.info("movie_share_succeeded", { movie_id: movie.id });
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        logger.error("movie_share_failed", { movie_id: movie.id });
        showToast("공유에 실패했습니다.");
      }
    } finally {
      setIsSharing(false);
    }
  }

  async function handleDownload() {
    setIsDownloading(true);
    logger.info("movie_download_clicked", { movie_id: movie.id });
    try {
      const result = await downloadMovie(movie.id);
      if (result.output_url) {
        window.location.href = getMovieDownloadFileUrl(movie.id, result.download_url);
      }
      logger.info("movie_download_succeeded", { movie_id: movie.id });
      showToast("다운로드가 준비되었습니다.");
    } catch {
      logger.error("movie_download_failed", { movie_id: movie.id });
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    logger.info("movie_delete_confirmed", { movie_id: movie.id });
    try {
      await deleteMovie(movie.id);
      logger.info("movie_delete_succeeded", { movie_id: movie.id });
      setShowConfirm(false);
      router.refresh();
    } catch {
      logger.error("movie_delete_failed", { movie_id: movie.id });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div
        className="group relative flex flex-col overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-2"
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* 포스터 */}
        <Link
          href={`/movies/${movie.id}`}
          className="relative block aspect-[2/3] w-full overflow-hidden"
          style={{ backgroundColor: "#0d1b2a" }}
        >
          {movie.thumbnail ? (
            <Image
              src={movie.thumbnail}
              alt={movie.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950 px-4 text-center">
              <span className="text-3xl text-amber-300" aria-hidden="true">▶</span>
              <span className="mt-3 text-xs font-medium leading-5 text-zinc-500">
                생성된 영화 미리보기 준비 중
              </span>
            </div>
          )}
          {/* 장르 뱃지 */}
          <span
            className="absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-bold text-zinc-900 tracking-wide"
            style={{
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              boxShadow: "0 2px 8px rgba(251,191,36,0.4)",
            }}
          >
            {movie.genre}
          </span>
          <span
            className="absolute bottom-2 left-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-zinc-200"
            style={{
              background: "rgba(0,0,0,0.58)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            {formatMovieStatus(movie.status)}
          </span>
          {/* 호버 그라디언트 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>

        {/* 정보 영역 */}
        <div className="flex flex-1 flex-col gap-3 p-3">
          <Link
            href={`/movies/${movie.id}`}
            className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 transition-colors hover:text-amber-400"
          >
            {movie.title}
          </Link>

          {/* 액션 버튼 */}
          <div className="mt-auto flex gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 rounded-lg py-1.5 text-xs font-medium text-blue-300 transition-all hover:text-blue-200 disabled:opacity-50"
              style={{
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              {isSharing ? "…" : "공유"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 rounded-lg py-1.5 text-xs font-medium text-amber-300 transition-all hover:text-amber-200 disabled:opacity-50"
              style={{
                background: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.2)",
              }}
            >
              {isDownloading ? "…" : "다운로드"}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex-1 rounded-lg py-1.5 text-xs font-medium text-red-400 transition-all hover:text-red-300"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              삭제
            </button>
          </div>
        </div>

        {/* 토스트 */}
        {toast && (
          <div
            className="absolute inset-x-2 bottom-14 flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg"
            style={{
              background: "rgba(13,27,42,0.95)",
              border: "1px solid rgba(251,191,36,0.2)",
            }}
          >
            {toast}
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div
            className="mx-4 w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{
              background: "linear-gradient(145deg, rgba(20,35,60,0.98), rgba(13,27,42,0.98))",
              border: "1px solid rgba(251,191,36,0.2)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(251,191,36,0.05)",
            }}
          >
            <h2 className="text-base font-semibold text-zinc-50">영화를 삭제할까요?</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              <span className="font-medium text-zinc-200">{movie.title}</span>을(를) 삭제하면
              되돌릴 수 없습니다.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-xl py-2 text-sm font-medium text-zinc-300 transition-all hover:text-zinc-100 disabled:opacity-50"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {isDeleting ? "삭제 중…" : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
