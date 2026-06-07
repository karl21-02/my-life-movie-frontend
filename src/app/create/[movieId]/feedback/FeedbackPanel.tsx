"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ApiError, api, type SummaryResponse, type FileInfo } from "@/lib/api";

type Tab = "prompt" | "image" | "video" | "document";
type GenerateStage = "idle" | "finalizing" | "generating";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "prompt", label: "시나리오", icon: "📝" },
  { key: "image", label: "사진", icon: "🖼️" },
  { key: "video", label: "영상", icon: "🎬" },
  { key: "document", label: "파일", icon: "📄" },
];

function FileList({ files, emptyText }: { files: FileInfo[]; emptyText: string }) {
  if (files.length === 0) {
    return <p className="text-sm text-zinc-500 text-center py-8">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {files.map((f) => (
        <li
          key={f.file_id}
          className="bg-zinc-800 rounded-xl px-4 py-3 flex flex-col gap-1"
        >
          <span className="text-sm font-medium text-zinc-200">{f.filename}</span>
          {f.extracted_text && (
            <span className="text-xs text-zinc-500 line-clamp-2">{f.extracted_text}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

interface Props {
  movieId: number;
}

export default function FeedbackPanel({ movieId }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("prompt");
  const [generateStage, setGenerateStage] = useState<GenerateStage>("idle");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function loadSummary() {
    setSummaryError(false);
    setSummary(null);
    try {
      setSummary(await api.movies.getSummary(movieId));
    } catch {
      setSummaryError(true);
    }
  }

  useEffect(() => {
    let ignore = false;
    api.movies.getSummary(movieId)
      .then((nextSummary) => {
        if (ignore) return;
        setSummary(nextSummary);
        setSummaryError(false);
      })
      .catch(() => {
        if (ignore) return;
        setSummaryError(true);
      });

    return () => {
      ignore = true;
    };
  }, [movieId]);

  const filesByType = (type: string) => (summary?.files ?? []).filter((f) => f.type === type);

  async function handleGenerate() {
    if (generateStage !== "idle" || !summary) return;

    setGenerateError(null);
    try {
      let latestSummary = summary;
      if (!latestSummary.is_finalized) {
        setGenerateStage("finalizing");
        latestSummary = await api.movies.finalizeStory(movieId);
        setSummary(latestSummary);
      }
      setGenerateStage("generating");
      await api.movies.generate(movieId);
      router.push(`/movies/${movieId}`);
    } catch (error) {
      setGenerateError(getGenerateErrorMessage(error));
      setGenerateStage("idle");
    }
  }

  function renderTabContent(s: SummaryResponse) {
    switch (activeTab) {
      case "prompt":
        return s.prompt ? (
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {s.prompt}
          </p>
        ) : (
          <p className="text-sm text-zinc-500 text-center py-8">
            입력된 시나리오 내용이 없습니다.
          </p>
        );
      case "image":
        return <FileList files={filesByType("image")} emptyText="첨부된 사진이 없습니다." />;
      case "video":
        return <FileList files={filesByType("video")} emptyText="첨부된 영상이 없습니다." />;
      case "document":
        return (
          <FileList files={filesByType("document")} emptyText="첨부된 문서가 없습니다." />
        );
    }
  }

  const tabCount = (key: Tab) => {
    if (key === "prompt") return null;
    const type = key === "image" ? "image" : key === "video" ? "video" : "document";
    const count = filesByType(type).length;
    return count > 0 ? count : null;
  };

  if (summaryError) {
    return (
      <div className="w-full max-w-3xl flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-zinc-400 text-sm">요약 정보를 불러오지 못했습니다.</p>
        <button
          type="button"
          onClick={loadSummary}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="w-full max-w-3xl flex items-center justify-center py-24">
        <span className="text-zinc-500 text-sm animate-pulse">요약 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6">
      {/* 메타 정보 */}
      <div className="flex gap-3">
        <div className="flex-1 bg-zinc-900 rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-zinc-500 font-medium">테마</span>
          <span className="text-sm font-semibold text-zinc-200">
            테마 #{summary.theme.theme_id}
          </span>
        </div>
        <div className="flex-1 bg-zinc-900 rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-zinc-500 font-medium">음악</span>
          <span className="text-sm font-semibold text-zinc-200">
            {summary.music ? `트랙 #${summary.music.music_id}` : "선택 없음"}
          </span>
        </div>
        <div className="flex-1 bg-zinc-900 rounded-2xl px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-zinc-500 font-medium">첨부 파일</span>
          <span className="text-sm font-semibold text-zinc-200">
            {summary.files.length}개
          </span>
        </div>
      </div>

      {/* 세로 탭 + 콘텐츠 */}
      <div className="bg-zinc-900 rounded-2xl overflow-hidden flex min-h-72">
        {/* 좌측 세로 탭 */}
        <div className="flex flex-col border-r border-zinc-800 w-36 shrink-0">
          {TABS.map((tab) => {
            const count = tabCount(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors border-l-2 text-left ${
                  activeTab === tab.key
                    ? "border-[#e3b65a] text-[#e3b65a] bg-[#e3b65a]/5"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {count !== null && (
                  <span className="text-xs bg-[#e3b65a]/20 text-[#e3b65a] rounded-full px-1.5 ml-auto">
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* 생성 버튼 */}
          <div className="mt-auto p-3">
            {generateError && (
              <p className="mb-2 text-xs leading-relaxed text-red-300">{generateError}</p>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generateStage !== "idle"}
              className="w-full py-3 rounded-xl bg-[#e3b65a] text-zinc-900 text-sm font-bold hover:bg-[#e3b65a]/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {getGenerateButtonText(generateStage)}
            </button>
          </div>
        </div>

        {/* 우측 콘텐츠 */}
        <div className="flex-1 p-5 min-h-48">{renderTabContent(summary)}</div>
      </div>
    </div>
  );
}

function getGenerateButtonText(stage: GenerateStage): string {
  if (stage === "finalizing") {
    return "이야기 정리 중...";
  }
  if (stage === "generating") {
    return "생성 요청 중...";
  }
  return "🎬 생성";
}

function getGenerateErrorMessage(error: unknown): string {
  if (
    error instanceof ApiError &&
    error.problem.code === "GENERATION_INPUT_NOT_READY"
  ) {
    return "영화 생성을 위한 이야기가 아직 준비되지 않았습니다. 내용을 조금 더 입력한 뒤 다시 시도해주세요.";
  }
  return "영화 생성 요청 중 오류가 발생했습니다. 다시 시도해주세요.";
}
