"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { api, type ChatMessage, type FileInfo } from "@/lib/api";
import StepGuideModal from "@/components/StepGuideModal";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf", ".txt", ".mp4", ".mov"];

function getExt(filename: string) {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

interface Props {
  movieId: number;
  initialHistory: ChatMessage[];
}

export default function InputPanel({ movieId, initialHistory }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [currentDraft, setCurrentDraft] = useState("");

  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [navigating, setNavigating] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const QUICK_ACTIONS = [
    "이야기 만들어주기",
    "관련 이야기 들려주기",
    "글 작성",
    "동기부여 바탕 만들어주기",
    "직장에 관한 도움 받기",
  ];

  async function handleSend() {
    const msg = input.trim();
    if (!msg || chatLoading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", message: msg }]);
    setChatLoading(true);
    try {
      const res = await api.movies.chat(movieId, msg);
      setMessages((prev) => [...prev, { role: "ai", message: res.ai_question }]);
      setCurrentDraft(res.current_draft);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", message: "오류가 발생했습니다. 다시 시도해주세요." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function uploadFile(file: File) {
    const ext = getExt(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      alert(`허용되지 않는 파일 형식입니다: ${ext}\n허용: jpg, jpeg, png, pdf, txt, mp4, mov`);
      return;
    }
    setUploading(true);
    try {
      const info = await api.movies.uploadFile(movieId, file);
      setUploadedFiles((prev) => [...prev, info]);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const f of files) await uploadFile(f);
    e.target.value = "";
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      for (const f of files) await uploadFile(f);
    },
    [movieId],
  );

  async function handleNext() {
    setNavigating(true);
    try {
      router.push(`/create/${movieId}/feedback`);
    } catch {
      setNavigating(false);
    }
  }

  function fileIcon(type: string) {
    if (type === "image") return "🖼️";
    if (type === "video") return "🎬";
    return "📄";
  }

  return (
    <>
      <StepGuideModal
        step={3}
        onSkip={() => router.push(`/create/${movieId}/feedback`)}
      />
    <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6">
      {/* 좌측: 파일 업로드 */}
      <aside className="w-full md:w-72 flex flex-col gap-4">
        {/* 개인정보 동의 체크박스 */}
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-0.5 accent-[#e3b65a]"
          />
          <span className="text-xs text-zinc-400 leading-relaxed">
            업로드한 파일은 영화 생성 목적으로만 활용됩니다.{" "}
            <span className="font-semibold text-zinc-200">개인정보 활용에 동의합니다.</span>
          </span>
        </label>

        <div
          onDragOver={(e) => { if (!consentChecked) return; e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={consentChecked ? handleDrop : undefined}
          onClick={() => consentChecked && fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-8 transition-colors ${
            !consentChecked
              ? "border-zinc-700 bg-zinc-900 cursor-not-allowed opacity-50"
              : isDragOver
              ? "border-[#e3b65a] bg-[#e3b65a]/10 cursor-pointer"
              : "border-zinc-600 bg-zinc-800 hover:border-[#e3b65a]/50 hover:bg-[#e3b65a]/5 cursor-pointer"
          }`}
        >
          <span className="text-3xl">{uploading ? "⏳" : "📁"}</span>
          <p className="text-sm font-medium text-zinc-300">
            {uploading ? "업로드 중..." : consentChecked ? "파일을 드래그하거나 클릭" : "동의 후 업로드 가능"}
          </p>
          <p className="text-xs text-zinc-500">jpg · png · pdf · txt · mp4 · mov</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.txt,.mp4,.mov"
          className="hidden"
          onChange={handleFileChange}
        />

        {uploadedFiles.length > 0 && (
          <ul className="flex flex-col gap-2">
            {uploadedFiles.map((f) => (
              <li
                key={f.file_id}
                className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200"
              >
                <span>{fileIcon(f.type)}</span>
                <span className="truncate">{f.filename}</span>
              </li>
            ))}
          </ul>
        )}

        {/* 시나리오 초안 미리보기 */}
        {currentDraft && (
          <div className="bg-[#e3b65a]/10 rounded-2xl p-4 border border-[#e3b65a]/30">
            <p className="text-xs font-semibold text-[#e3b65a] mb-1">시나리오 초안</p>
            <p className="text-sm text-zinc-200 leading-relaxed">{currentDraft}</p>
          </div>
        )}
      </aside>

      {/* 우측: AI 채팅 */}
      <section className="flex-1 bg-zinc-900 rounded-2xl p-6 flex flex-col gap-4 min-h-120">
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 gap-2">
              <span className="text-4xl">🎬</span>
              <p className="text-sm">AI에게 당신의 이야기를 들려주세요.</p>
              <p className="text-xs">어떤 시절, 어떤 감정을 담고 싶은지 자유롭게 적어보세요.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`text-sm px-4 py-3 rounded-2xl max-w-[80%] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#e3b65a] text-zinc-900 rounded-br-sm"
                    : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="text-sm px-4 py-3 rounded-2xl bg-zinc-800 text-zinc-500 animate-pulse rounded-bl-sm">
                AI가 생각 중...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 빠른 액션 칩 */}
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => setInput(action)}
              className="text-xs px-3 py-1.5 rounded-full border border-[#e3b65a]/30 bg-[#e3b65a]/10 text-[#e3b65a] hover:bg-[#e3b65a]/20 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>

        {/* 입력창 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="이야기를 입력하세요..."
            disabled={chatLoading}
            className="flex-1 text-sm border border-zinc-700 bg-zinc-800 text-zinc-200 placeholder-zinc-500 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#e3b65a]/40 disabled:bg-zinc-900"
          />
          <button
            onClick={handleSend}
            disabled={chatLoading || !input.trim()}
            className="shrink-0 px-4 py-2.5 bg-[#e3b65a] text-zinc-900 rounded-xl text-sm font-medium hover:bg-[#e3b65a]/90 disabled:opacity-50 transition-colors"
          >
            전송
          </button>
        </div>

        {/* 다음 단계 버튼 */}
        <button
          onClick={handleNext}
          disabled={navigating}
          className="w-full py-3 rounded-xl bg-[#e3b65a] text-zinc-900 font-semibold hover:bg-[#e3b65a]/90 transition-colors disabled:opacity-50"
        >
          {navigating ? "이동 중..." : "다음 단계로 →"}
        </button>
      </section>
    </div>
    </>
  );
}
