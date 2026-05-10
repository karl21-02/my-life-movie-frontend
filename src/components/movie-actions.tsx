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
      await downloadMovie(movieId);
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
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 rounded-xl bg-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-600 disabled:opacity-50 sm:flex-none"
        >
          {isDownloading ? "저장 중…" : "⬇ 다운로드"}
        </button>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="flex-1 rounded-xl bg-red-900/60 px-5 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-800 sm:flex-none"
        >
          삭제
        </button>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-zinc-800 p-6 shadow-2xl">
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
                className="flex-1 rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
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
