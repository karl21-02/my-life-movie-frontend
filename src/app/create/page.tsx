import { api } from "@/lib/api";
import StepIndicator from "@/components/StepIndicator";
import ThemeGrid from "./ThemeGrid";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const themes = await api.themes.list();

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <StepIndicator current={1} />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        내 인생 영화의 테마를 선택하세요
      </h1>
      <p className="text-gray-500 mb-10">
        선택한 테마에 맞게 영화 스타일과 분위기가 결정됩니다.
      </p>
      <ThemeGrid themes={themes} />
    </main>
  );
}
