import { api } from "@/lib/api";
import StepIndicator from "@/components/StepIndicator";
import InputPanel from "./InputPanel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ movieId: string }>;
}

export default async function InputPage({ params }: Props) {
  const { movieId } = await params;
  const movieId_num = Number(movieId);

  const { history } = await api.movies.getChatHistory(movieId_num);

  return (
    <main className="min-h-screen bg-[#0d0d0d] flex flex-col items-center px-4 py-10">
      <StepIndicator current={3} />
      <h1 className="text-2xl font-bold text-white mt-8 mb-2">당신의 이야기를 들려주세요</h1>
      <p className="text-sm text-zinc-400 mb-8">
        AI와 대화하며 영화 시나리오를 완성하고, 사진·영상·문서를 첨부해보세요.
      </p>
      <InputPanel movieId={movieId_num} initialHistory={history} />
    </main>
  );
}
