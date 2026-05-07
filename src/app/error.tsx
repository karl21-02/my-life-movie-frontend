"use client";

import { useEffect } from "react";

import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("app_render_failed", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center text-zinc-950">
      <div className="flex max-w-md flex-col gap-3">
        <p className="text-sm font-medium text-zinc-500">Application Error</p>
        <h1 className="text-2xl font-semibold">화면을 불러오지 못했습니다.</h1>
        <p className="text-base leading-7 text-zinc-600">
          잠시 후 다시 시도해주세요. 문제가 계속되면 request id와 함께 팀에
          공유해주세요.
        </p>
      </div>
      <button
        className="h-11 rounded-md bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        onClick={reset}
        type="button"
      >
        다시 시도
      </button>
    </main>
  );
}
