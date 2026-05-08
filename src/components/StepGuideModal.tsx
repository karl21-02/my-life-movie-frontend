"use client";

import { useState } from "react";

interface Props {
  step: 1 | 2 | 3 | 4;
  onSkip?: () => void;
}

const GUIDE_CONTENT: Record<number, { title: string; description: string }> = {
  1: {
    title: "테마를 선택해주세요",
    description:
      "영화의 전체적인 분위기와 스타일을 결정하는 단계입니다.\n하이틴, 사이버펑크, 동화 등 6가지 테마 중 원하는 것을 골라보세요.",
  },
  2: {
    title: "배경 음악을 선택해주세요",
    description:
      "영화의 감동을 배가시킬 음악을 고르는 단계입니다.\nAI에게 원하는 분위기를 말하면 맞춤 음악을 추천해드려요.",
  },
  3: {
    title: "당신의 이야기를 들려주세요",
    description:
      "AI와 대화하며 영화에 담을 에피소드와 감정을 정리하는 단계입니다.\n사진, 영상, 파일을 첨부해 더 풍부한 이야기를 만들어보세요.",
  },
  4: {
    title: "최종 내용을 확인해주세요",
    description:
      "지금까지 입력한 내용을 한눈에 확인하는 단계입니다.\n모든 내용이 맞으면 생성 버튼을 눌러 나만의 인생 영화를 만들어보세요.",
  },
};

export default function StepGuideModal({ step, onSkip }: Props) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const { title, description } = GUIDE_CONTENT[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[#e3b65a]">Step {step} / 4</span>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-sm text-zinc-400 whitespace-pre-line leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex gap-2">
          {onSkip && (
            <button
              onClick={() => {
                setVisible(false);
                onSkip();
              }}
              className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              건너뛰기
            </button>
          )}
          <button
            onClick={() => setVisible(false)}
            className="flex-1 py-2.5 rounded-xl bg-[#e3b65a] text-zinc-900 text-sm font-semibold hover:bg-[#e3b65a]/90 transition-colors"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
