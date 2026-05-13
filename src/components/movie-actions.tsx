"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { logger } from "@/lib/logger";
import { deleteMovie, downloadMovie } from "@/lib/movies";

type Props = {
  movieId: number;
  movieTitle: string;
};

export default function MovieActions({ movieId, movieTitle }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    logger.info("movie_download_clicked", { movie_id: movieId });
    try {
      const result = await downloadMovie(movieId);
      if (result.output_url) {
        window.location.href = result.output_url;
      }
      logger.info("movie_download_succeeded", { movie_id: movieId });
    } catch {
      logger.error("movie_download_failed", { movie_id: movieId });
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    logger.info("movie_delete_confirmed", { movie_id: movieId });
    try {
      await deleteMovie(movieId);
      logger.info("movie_delete_succeeded", { movie_id: movieId });
      router.push("/movies");
      router.refresh();
    } catch {
      logger.error("movie_delete_failed", { movie_id: movieId });
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-amber-300 transition-all hover:scale-105 disabled:opacity-50"
          style={{
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.25)",
          }}
        >
          {isDownloading ? "저장 중…" : "⬇ 다운로드"}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-red-400 transition-all hover:scale-105"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          삭제
        </button>
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
              <span className="font-medium text-zinc-200">{movieTitle}</span>을(를) 삭제하면
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
