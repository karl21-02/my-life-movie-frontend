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
                    ? "bg-violet-500 text-white"
                    : isDone
                    ? "bg-violet-200 text-violet-700"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {isDone ? "✓" : step}
              </div>
              <span
                className={`text-xs mt-1 ${
                  isActive ? "text-violet-600 font-semibold" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {step < STEPS.length && (
              <div
                className={`w-12 h-0.5 mb-4 ${isDone ? "bg-violet-300" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
