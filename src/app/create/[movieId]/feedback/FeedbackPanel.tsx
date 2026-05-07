"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, type SummaryResponse, type FileInfo } from "@/lib/api";

type Tab = "prompt" | "image" | "video" | "document";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "prompt", label: "시나리오", icon: "📝" },
  { key: "image", label: "사진", icon: "🖼️" },
  { key: "video", label: "영상", icon: "🎬" },
  { key: "document", label: "파일", icon: "📄" },
];

function FileList({ files, emptyText }: { files: FileInfo[]; emptyText: string }) {
  if (files.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {files.map((f) => (
        <li
          key={f.file_id}
          className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col gap-1"
        >
          <span className="text-sm font-medium text-gray-700">{f.filename}</span>
          {f.extracted_text && (
            <span className="text-xs text-gray-400 line-clamp-2">{f.extracted_text}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

interface Props {
  movieId: number;
  summary: SummaryResponse;
}

export default function FeedbackPanel({ movieId, summary }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("prompt");
  const [generating, setGenerating] = useState(false);

  const filesByType = (type: string) => summary.files.filter((f) => f.type === type);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await api.movies.generate(movieId);
      router.push(`/movies/${movieId}`);
    } catch {
      alert("영화 생성 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
      setGenerating(false);
    }
  }

  function renderTabContent() {
    switch (activeTab) {
      case "prompt":
        return summary.prompt ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {summary.prompt}
          </p>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
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

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6">
      {/* 메타 정보 */}
      <div className="flex gap-3">
        <div className="flex-1 bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-gray-400 font-medium">테마</span>
          <span className="text-sm font-semibold text-gray-700">
            테마 #{summary.theme.theme_id}
          </span>
        </div>
        <div className="flex-1 bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-gray-400 font-medium">음악</span>
          <span className="text-sm font-semibold text-gray-700">
            {summary.music ? `트랙 #${summary.music.music_id}` : "선택 없음"}
          </span>
        </div>
        <div className="flex-1 bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-col gap-1">
          <span className="text-xs text-gray-400 font-medium">첨부 파일</span>
          <span className="text-sm font-semibold text-gray-700">
            {summary.files.length}개
          </span>
        </div>
      </div>

      {/* 세로 탭 + 콘텐츠 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex min-h-72">
        {/* 좌측 세로 탭 */}
        <div className="flex flex-col border-r border-gray-100 w-36 shrink-0">
          {TABS.map((tab) => {
            const count = tabCount(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors border-l-2 text-left ${
                  activeTab === tab.key
                    ? "border-violet-500 text-violet-600 bg-violet-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {count !== null && (
                  <span className="text-xs bg-violet-100 text-violet-600 rounded-full px-1.5 ml-auto">
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* 생성 버튼 */}
          <div className="mt-auto p-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {generating ? "생성 중..." : "🎬 생성"}
            </button>
          </div>
        </div>

        {/* 우측 콘텐츠 */}
        <div className="flex-1 p-5 min-h-48">{renderTabContent()}</div>
      </div>
    </div>
  );
}
