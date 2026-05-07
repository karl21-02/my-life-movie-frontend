import { api } from "@/lib/api";
import StepIndicator from "@/components/StepIndicator";
import StepGuideModal from "@/components/StepGuideModal";
import FeedbackPanel from "./FeedbackPanel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ movieId: string }>;
}

export default async function FeedbackPage({ params }: Props) {
  const { movieId } = await params;
  const movieId_num = Number(movieId);

  const summary = await api.movies.getSummary(movieId_num);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-10">
      <StepGuideModal step={4} />
      <StepIndicator current={4} />
      <h1 className="text-2xl font-bold text-gray-800 mt-8 mb-2">최종 확인</h1>
      <p className="text-sm text-gray-500 mb-8">
        입력한 내용을 확인하고 영화 생성을 시작하세요.
      </p>
      <FeedbackPanel movieId={movieId_num} summary={summary} />
    </main>
  );
}
