import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MusicPanel from "@/app/create/[movieId]/music/MusicPanel";
import { api, type MusicTrack } from "@/lib/api";

const routerPushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    api: {
      music: {
        recommend: vi.fn(),
      },
      movies: {
        updateMusic: vi.fn(),
      },
    },
  };
});

const recommendMock = vi.mocked(api.music.recommend);
const updateMusicMock = vi.mocked(api.movies.updateMusic);

const defaultTracks: MusicTrack[] = [
  {
    music_id: 101,
    title: "Summer Crush",
    file_url: "",
    is_ai_recommended: false,
  },
];

describe("MusicPanel", () => {
  beforeEach(() => {
    recommendMock.mockReset();
    updateMusicMock.mockReset();
    routerPushMock.mockReset();
  });

  it("AI 추천 결과의 첫 번째 곡을 목록에 추가하고 자동 선택한다", async () => {
    recommendMock.mockResolvedValue({
      ai_message: "추천곡을 골랐어요.",
      tracks: [
        {
          music_id: 9010,
          title: "Quiet Memory",
          file_url: "",
          is_ai_recommended: true,
          artist: "My Life Movie AI",
          provider: "local",
        },
      ],
    });
    const user = userEvent.setup();

    render(<MusicPanel movieId={10} defaultTracks={defaultTracks} />);
    await user.type(screen.getByPlaceholderText("감정 예: 차분함, 설렘"), "차분함");
    await user.type(screen.getByPlaceholderText("장면 예: 졸업식, 재회"), "졸업식");
    await user.type(screen.getByPlaceholderText("이야기 맥락을 짧게 적어주세요"), "친구들과 헤어지는 이야기");
    await user.type(screen.getByPlaceholderText("피하고 싶은 느낌 예: 너무 빠른 비트"), "전자음");
    await user.type(screen.getByPlaceholderText("원하는 분위기를 입력하세요"), "차분한 분위기");
    await user.click(screen.getByRole("button", { name: "전송" }));

    await waitFor(() => {
      expect(screen.getByText("Quiet Memory")).toBeInTheDocument();
    });
    expect(screen.getAllByText(/My Life Movie AI/).length).toBeGreaterThan(0);
    expect(screen.getByText(/마음에 들면 다음 단계로 진행하세요/)).toBeInTheDocument();
    expect(screen.getByText("선택됨")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음 단계로" })).toBeEnabled();
    expect(recommendMock).toHaveBeenCalledWith(10, {
      message: "차분한 분위기",
      mood: "차분함",
      scene: "졸업식",
      story_hint: "친구들과 헤어지는 이야기",
      avoid: "전자음",
    });
  });

  it("AI 추천으로 선택된 곡을 저장하고 다음 입력 단계로 이동한다", async () => {
    recommendMock.mockResolvedValue({
      ai_message: "추천곡을 골랐어요.",
      tracks: [
        {
          music_id: 9010,
          title: "Quiet Memory",
          file_url: "",
          is_ai_recommended: true,
        },
      ],
    });
    updateMusicMock.mockResolvedValue({ movie_id: 10, music_id: 9010 });
    const user = userEvent.setup();

    render(<MusicPanel movieId={10} defaultTracks={defaultTracks} />);
    await user.type(screen.getByPlaceholderText("원하는 분위기를 입력하세요"), "차분한 분위기");
    await user.click(screen.getByRole("button", { name: "전송" }));
    await screen.findByText("Quiet Memory");
    await user.click(screen.getByRole("button", { name: "다음 단계로" }));

    expect(updateMusicMock).toHaveBeenCalledWith(10, 9010);
    expect(routerPushMock).toHaveBeenCalledWith("/create/10/input");
  });
});
