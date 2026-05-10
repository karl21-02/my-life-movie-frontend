"use client";

import Link from "next/link";
import { useEffect } from "react";

import { logger } from "@/lib/logger";

export default function MovieDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("movie_detail_render_failed", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-900 px-6 text-center">
      <p className="text-4xl">🎬</p>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-zinc-50">영화를 불러오지 못했습니다</h2>
        <p className="text-sm text-zinc-400">잠시 후 다시 시도해주세요.</p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/movies"
          className="rounded-xl border border-zinc-600 px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          목록으로
        </Link>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-amber-300"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
