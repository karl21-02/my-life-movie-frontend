import { api } from "@/lib/api";
import StepIndicator from "@/components/StepIndicator";
import StepGuideModal from "@/components/StepGuideModal";
import ThemeGrid from "./ThemeGrid";

export const dynamic = "force-dynamic";

function FilmStrip({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className="flex flex-col gap-1.5 select-none pointer-events-none"
      style={{ opacity: 0.2 }}
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5"
          style={{ flexDirection: flip ? "row-reverse" : "row" }}
        >
          <div className="flex flex-col gap-2">
            <div className="w-5 h-4 bg-zinc-400 rounded-sm" />
            <div className="w-5 h-4 bg-zinc-400 rounded-sm" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-5 h-4 bg-zinc-400 rounded-sm" />
            <div className="w-5 h-4 bg-zinc-400 rounded-sm" />
          </div>
          <div className="w-28 h-20 bg-zinc-700 rounded-sm border border-zinc-600 flex items-center justify-center">
            <div className="w-20 h-14 bg-zinc-800 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function CreatePage() {
  const themes = await api.themes.list();

  return (
    <main
      className="min-h-screen flex flex-col items-center py-16 px-4 relative overflow-hidden"
      style={{
        backgroundColor: "#0d0d0d",
        backgroundImage:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(251,191,36,0.08) 0%, transparent 70%)",
      }}
    >
      {/* 왼쪽 필름 스트립 */}
      <div className="absolute left-0 top-0 h-full flex items-start pt-8 overflow-hidden">
        <FilmStrip />
      </div>
      {/* 왼쪽 페이드 */}
      <div
        className="absolute left-0 top-0 h-full w-28 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, #0d0d0d 40%, transparent 100%)",
        }}
      />

      {/* 오른쪽 필름 스트립 */}
      <div className="absolute right-0 top-0 h-full flex items-start pt-8 overflow-hidden">
        <FilmStrip flip />
      </div>
      {/* 오른쪽 페이드 */}
      <div
        className="absolute right-0 top-0 h-full w-28 pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, #0d0d0d 40%, transparent 100%)",
        }}
      />

      {/* 본문 */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <StepGuideModal step={1} />
        <StepIndicator current={1} />
        <h1 className="text-3xl font-bold text-white mb-2">
          내 인생 영화의 테마를 선택하세요
        </h1>
        <p className="text-zinc-400 mb-10">
          선택한 테마에 맞게 영화 스타일과 분위기가 결정됩니다.
        </p>
        <ThemeGrid themes={themes} />
      </div>
    </main>
  );
}
