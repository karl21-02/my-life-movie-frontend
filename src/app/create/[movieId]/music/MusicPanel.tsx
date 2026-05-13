"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { api, type MusicTrack } from "@/lib/api";

interface Props {
  movieId: number;
  defaultTracks: MusicTrack[];
}

export default function MusicPanel({ movieId, defaultTracks }: Props) {
  const router = useRouter();
  const [tracks, setTracks] = useState<MusicTrack[]>(defaultTracks);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [mood, setMood] = useState("");
  const [scene, setScene] = useState("");
  const [storyHint, setStoryHint] = useState("");
  const [avoid, setAvoid] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "감정, 장면, 이야기 맥락을 알려주시면 더 정확하게 추천해드릴게요." },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function isPlayable(url: string | null | undefined) {
    return !!url && (url.startsWith("http://") || url.startsWith("https://"));
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function handlePlay(track: MusicTrack) {
    if (playingId === track.music_id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(track.file_url);
    audio.play().catch(() => {
      setPlayingId(null);
    });
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(track.music_id);
  }

  async function handleChatSend() {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const res = await api.music.recommend(movieId, {
        message: msg,
        mood: mood.trim() || undefined,
        scene: scene.trim() || undefined,
        story_hint: storyHint.trim() || undefined,
        avoid: avoid.trim() || undefined,
      });
      if (res.tracks.length > 0) {
        const recommendedTrack = res.tracks[0];
        setSelectedId(recommendedTrack.music_id);
        setTracks((prev) => {
          const existingIds = new Set(prev.map((t) => t.music_id));
          const newOnes = res.tracks.filter((t) => !existingIds.has(t.music_id));
          return [...prev, ...newOnes];
        });
        setChatMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: `${res.ai_message} '${trackLabel(recommendedTrack)}'을 선택해둘게요. 마음에 들면 다음 단계로 진행하세요.`,
          },
        ]);
      } else {
        setChatMessages((prev) => [...prev, { role: "ai", text: res.ai_message }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", text: "오류가 발생했습니다. 다시 시도해주세요." }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleConfirm() {
    if (selectedId === null) {
      alert("음악을 선택해주세요.");
      return;
    }
    setSaving(true);
    try {
      await api.movies.updateMusic(movieId, selectedId);
      router.push(`/create/${movieId}/input`);
    } catch {
      alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      setSaving(false);
    }
  }

  function trackLabel(track: MusicTrack) {
    return track.artist ? `${track.title} - ${track.artist}` : track.title;
  }

  return (
    <div className="w-full max-w-5xl flex flex-col md:flex-row gap-6">
      {/* 음악 목록 */}
      <section className="flex-1 bg-zinc-900 rounded-2xl p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-zinc-200 mb-2">테마 음악 목록</h2>
        <ul className="flex flex-col gap-2">
          {tracks.map((track) => {
            const playable = isPlayable(track.file_url);
            return (
            <li
              key={track.music_id}
              className={`flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition-colors border-2 ${
                selectedId === track.music_id
                  ? "border-[#e3b65a] bg-[#e3b65a]/10"
                  : "border-transparent bg-zinc-800 hover:bg-zinc-700"
              }`}
              onClick={() => setSelectedId(track.music_id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlay(track);
                  }}
                  disabled={!playable}
                  title={playable ? undefined : "재생 불가 (Spotify 연동 후 지원)"}
                  className={`shrink-0 w-8 h-8 rounded-full bg-[#e3b65a]/20 flex items-center justify-center text-[#e3b65a] transition-colors ${playable ? "hover:bg-[#e3b65a]/30" : "opacity-40 cursor-not-allowed"}`}
                >
                  {playingId === track.music_id ? "⏸" : "▶"}
                </button>
                <span className="min-w-0 text-sm font-medium text-zinc-100 truncate">
                  {track.title}
                  {track.artist && (
                    <span className="ml-1 text-xs font-normal text-zinc-400">- {track.artist}</span>
                  )}
                </span>
                {track.is_ai_recommended && (
                  <span className="shrink-0 text-xs bg-[#e3b65a]/20 text-[#e3b65a] px-2 py-0.5 rounded-full">AI 추천</span>
                )}
                {track.provider === "spotify" && (
                  <span className="shrink-0 text-xs bg-green-500/15 text-green-300 px-2 py-0.5 rounded-full">Spotify</span>
                )}
              </div>
              {selectedId === track.music_id && (
                <span className="shrink-0 text-[#e3b65a] text-sm font-medium">선택됨</span>
              )}
            </li>
          );
          })}
        </ul>
        <button
          onClick={handleConfirm}
          disabled={saving || selectedId === null}
          className="mt-4 w-full py-3 rounded-xl bg-[#e3b65a] text-zinc-900 font-semibold hover:bg-[#e3b65a]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "저장 중..." : "다음 단계로"}
        </button>
      </section>

      {/* AI 채팅 */}
      <section className="w-full md:w-80 bg-zinc-900 rounded-2xl p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-zinc-200 mb-2">AI 음악 추천</h2>
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="감정 예: 차분함, 설렘"
            className="text-sm border border-zinc-700 bg-zinc-800 text-zinc-200 placeholder-zinc-500 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#e3b65a]/40"
          />
          <input
            type="text"
            value={scene}
            onChange={(e) => setScene(e.target.value)}
            placeholder="장면 예: 졸업식, 재회"
            className="text-sm border border-zinc-700 bg-zinc-800 text-zinc-200 placeholder-zinc-500 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#e3b65a]/40"
          />
          <textarea
            value={storyHint}
            onChange={(e) => setStoryHint(e.target.value)}
            placeholder="이야기 맥락을 짧게 적어주세요"
            rows={2}
            className="resize-none text-sm border border-zinc-700 bg-zinc-800 text-zinc-200 placeholder-zinc-500 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#e3b65a]/40"
          />
          <input
            type="text"
            value={avoid}
            onChange={(e) => setAvoid(e.target.value)}
            placeholder="피하고 싶은 느낌 예: 너무 빠른 비트"
            className="text-sm border border-zinc-700 bg-zinc-800 text-zinc-200 placeholder-zinc-500 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#e3b65a]/40"
          />
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-72">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm px-3 py-2 rounded-xl max-w-[90%] ${
                msg.role === "ai"
                  ? "bg-zinc-800 text-zinc-200 self-start"
                  : "bg-[#e3b65a] text-zinc-900 self-end"
              }`}
            >
              {msg.text}
            </div>
          ))}
          {chatLoading && (
            <div className="text-sm px-3 py-2 rounded-xl bg-zinc-800 text-zinc-500 self-start animate-pulse">
              추천 중...
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
            placeholder="원하는 분위기를 입력하세요"
            className="flex-1 text-sm border border-zinc-700 bg-zinc-800 text-zinc-200 placeholder-zinc-500 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#e3b65a]/40"
          />
          <button
            onClick={handleChatSend}
            disabled={chatLoading || !chatInput.trim()}
            className="shrink-0 px-3 py-2 bg-[#e3b65a] text-zinc-900 rounded-xl text-sm hover:bg-[#e3b65a]/90 disabled:opacity-50 transition-colors"
          >
            전송
          </button>
        </div>
      </section>
    </div>
  );
}
