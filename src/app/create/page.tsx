import { api } from "@/lib/api";
import StepIndicator from "@/components/StepIndicator";
import StepGuideModal from "@/components/StepGuideModal";
import ThemeGrid from "./ThemeGrid";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const themes = await api.themes.list();

  return (
    <main className="min-h-screen bg-[#0d0d0d] flex flex-col items-center py-16 px-4">
      <StepGuideModal step={1} />
      <StepIndicator current={1} />
      <h1 className="text-3xl font-bold text-white mb-2">
        내 인생 영화의 테마를 선택하세요
      </h1>
      <p className="text-zinc-400 mb-10">
        선택한 테마에 맞게 영화 스타일과 분위기가 결정됩니다.
      </p>
      <ThemeGrid themes={themes} />
    </main>
  );
}
