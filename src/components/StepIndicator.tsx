// 현재 진행 상황 표시 컴포넌트
const STEPS = ["테마 선택", "음악 선택", "정보 입력", "최종 확인"];

export default function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={step} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-[#e3b65a] text-zinc-900"
                    : isDone
                    ? "bg-[#e3b65a]/30 text-[#e3b65a]"
                    : "bg-zinc-700 text-zinc-500"
                }`}
              >
                {isDone ? "✓" : step}
              </div>
              <span
                className={`text-xs mt-1 ${
                  isActive ? "text-[#e3b65a] font-semibold" : "text-zinc-500"
                }`}
              >
                {label}
              </span>
            </div>
            {step < STEPS.length && (
              <div
                className={`w-12 h-0.5 mb-4 ${isDone ? "bg-[#e3b65a]/50" : "bg-zinc-700"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
