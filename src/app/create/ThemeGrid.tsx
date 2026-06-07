"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isUnauthenticatedError } from "@/features/auth/errors";
import { api, type Theme } from "@/lib/api";
import { APP_ROUTES } from "@/lib/routes";

const LOGIN_NEXT_CREATE_PATH = `${APP_ROUTES.auth.login}?next=${encodeURIComponent(
  APP_ROUTES.createMovie,
)}`;

const THEME_IMAGES: Record<string, string> = {
  "하이틴": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
  "사이버펑크": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80",
  "무성영화": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=80",
  "동화": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
  "재패니즈 노스탤지아": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
  "지브리": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80",
};

function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128;
}

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
      {themes.map((theme) => {
        const imgUrl = THEME_IMAGES[theme.name];
        const light = isLightColor(theme.preview_color);
        const titleColor = light ? "text-zinc-800" : "text-white";
        const descColor = light ? "text-zinc-700" : "text-zinc-200";

        return (
          <button
            key={theme.theme_id}
            onClick={() => handleSelect(theme.theme_id)}
            disabled={loadingId !== null}
            className="relative rounded-2xl h-48 flex flex-col justify-end p-5 text-left shadow-md hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
            style={{ backgroundColor: theme.preview_color }}
          >
            {/* 배경 이미지 */}
            {imgUrl && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${imgUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            )}
            {/* 그라디언트 오버레이 */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, ${theme.preview_color}ee 0%, ${theme.preview_color}88 50%, ${theme.preview_color}33 100%)`,
              }}
            />

            {/* 로딩 오버레이 */}
            {loadingId === theme.theme_id && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl z-10">
                <span className="text-white font-medium text-sm">선택 중...</span>
              </div>
            )}

            {/* 텍스트 */}
            <span className={`relative z-10 text-lg font-bold drop-shadow-sm ${titleColor}`}>
              {theme.name}
            </span>
            <span className={`relative z-10 text-xs mt-1 line-clamp-2 leading-relaxed ${descColor}`}>
              {theme.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
