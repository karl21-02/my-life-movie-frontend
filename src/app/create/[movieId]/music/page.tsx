import { api } from "@/lib/api";
import StepIndicator from "@/components/StepIndicator";
import StepGuideModal from "@/components/StepGuideModal";
import MusicPanel from "./MusicPanel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ movieId: string }>;
  searchParams: Promise<{ theme_id?: string }>;
}

export default async function MusicPage({ params, searchParams }: Props) {
  const { movieId } = await params;
  const { theme_id } = await searchParams;
  const themeId = Number(theme_id ?? 1);
  const movieId_num = Number(movieId);

  const musicList = await api.music.listByTheme(themeId);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <StepGuideModal step={2} />
      <StepIndicator current={2} />
      <h1 className="text-2xl font-bold text-gray-800 mt-8 mb-2">음악을 선택해주세요</h1>
      <p className="text-sm text-gray-500 mb-8">영화의 분위기를 완성할 배경 음악을 골라보세요.</p>
      <MusicPanel
        movieId={movieId_num}
        themeId={themeId}
        defaultTracks={musicList.default_tracks}
      />
    </main>
  );
}
