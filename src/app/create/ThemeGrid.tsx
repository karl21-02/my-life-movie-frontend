"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isUnauthenticatedError } from "@/features/auth/errors";
import { api, type Theme } from "@/lib/api";
import { APP_ROUTES } from "@/lib/routes";

const LOGIN_NEXT_CREATE_PATH = `${APP_ROUTES.auth.login}?next=${encodeURIComponent(
  APP_ROUTES.createMovie,
)}`;

export default function ThemeGrid({ themes }: { themes: Theme[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleSelect(themeId: number) {
    setLoadingId(themeId);
    try {
      const { movie_id } = await api.movies.createDraft(themeId);
      router.push(`/create/${movie_id}/music?theme_id=${themeId}`);
    } catch (error: unknown) {
      if (isUnauthenticatedError(error)) {
        router.push(LOGIN_NEXT_CREATE_PATH);
        return;
      }

      alert("오류가 발생했습니다. 다시 시도해주세요.");
      setLoadingId(null);
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-5 w-full max-w-3xl">
      {themes.map((theme) => (
        <button
          key={theme.theme_id}
          onClick={() => handleSelect(theme.theme_id)}
          disabled={loadingId !== null}
          className="relative rounded-2xl h-48 flex flex-col justify-end p-5 text-left shadow-md hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
          style={{ backgroundColor: theme.preview_color }}
        >
          {loadingId === theme.theme_id && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
              <span className="text-white font-medium text-sm">선택 중...</span>
            </div>
          )}
          <span className="text-lg font-bold text-white drop-shadow-sm">
            {theme.name}
          </span>
          <span className="text-xs text-zinc-300 mt-1 line-clamp-2 leading-relaxed">
            {theme.description}
          </span>
        </button>
      ))}
    </div>
  );
}
