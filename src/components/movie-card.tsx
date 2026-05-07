"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { logger } from "@/lib/logger";
import { deleteMovie, downloadMovie, shareMovie } from "@/lib/movies";
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
      await downloadMovie(movie.id);
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
      <div className="group relative flex flex-col overflow-hidden rounded-xl bg-zinc-800 shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
        {/* 포스터 */}
        <Link href={`/movies/${movie.id}`} className="relative block aspect-[2/3] w-full overflow-hidden bg-zinc-700">
          <Image
            src={movie.thumbnail}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-zinc-900">
            {movie.genre}
          </span>
        </Link>

        {/* 정보 영역 */}
        <div className="flex flex-1 flex-col gap-3 p-3">
          <Link
            href={`/movies/${movie.id}`}
            className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-50 transition-colors hover:text-amber-400"
          >
            {movie.title}
          </Link>

          {/* 액션 버튼 3개 */}
          <div className="mt-auto flex gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 rounded-lg bg-zinc-700 px-2 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600 disabled:opacity-50"
            >
              {isSharing ? "…" : "공유"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 rounded-lg bg-zinc-700 px-2 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600 disabled:opacity-50"
            >
              {isDownloading ? "…" : "다운로드"}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex-1 rounded-lg bg-red-900/60 px-2 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-800"
            >
              삭제
            </button>
          </div>
        </div>

        {/* 토스트 메시지 */}
        {toast && (
          <div className="absolute inset-x-2 bottom-14 flex items-center justify-center rounded-lg bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg">
            {toast}
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-zinc-800 p-6 shadow-2xl">
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
