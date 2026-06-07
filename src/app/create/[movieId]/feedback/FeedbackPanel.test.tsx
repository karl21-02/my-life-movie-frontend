import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FeedbackPanel from "@/app/create/[movieId]/feedback/FeedbackPanel";
import { api, type SummaryResponse } from "@/lib/api";

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
      movies: {
        getSummary: vi.fn(),
        finalizeStory: vi.fn(),
        generate: vi.fn(),
      },
    },
  };
});

const getSummaryMock = vi.mocked(api.movies.getSummary);
const finalizeStoryMock = vi.mocked(api.movies.finalizeStory);
const generateMock = vi.mocked(api.movies.generate);

describe("FeedbackPanel", () => {
  beforeEach(() => {
    routerPushMock.mockReset();
    getSummaryMock.mockReset();
    finalizeStoryMock.mockReset();
    generateMock.mockReset();
  });

  it("미확정 상태에서는 finalize-story 후 generate를 호출한다", async () => {
    getSummaryMock.mockResolvedValue(createSummary({ is_finalized: false }));
    finalizeStoryMock.mockResolvedValue(createSummary({ is_finalized: true }));
    generateMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<FeedbackPanel movieId={37} />);
    await screen.findByText("테마 #1");
    await user.click(screen.getByRole("button", { name: /생성/ }));

    await waitFor(() => expect(generateMock).toHaveBeenCalledWith(37));
    expect(finalizeStoryMock).toHaveBeenCalledWith(37);
    expect(finalizeStoryMock.mock.invocationCallOrder[0]).toBeLessThan(
      generateMock.mock.invocationCallOrder[0],
    );
    expect(routerPushMock).toHaveBeenCalledWith("/movies/37");
  });

  it("확정 상태에서는 finalize-story를 생략하고 generate만 호출한다", async () => {
    getSummaryMock.mockResolvedValue(createSummary({ is_finalized: true }));
    generateMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<FeedbackPanel movieId={37} />);
    await screen.findByText("테마 #1");
    await user.click(screen.getByRole("button", { name: /생성/ }));

    await waitFor(() => expect(generateMock).toHaveBeenCalledWith(37));
    expect(finalizeStoryMock).not.toHaveBeenCalled();
    expect(routerPushMock).toHaveBeenCalledWith("/movies/37");
  });

  it("finalize-story 실패 시 generate를 호출하지 않고 오류를 보여준다", async () => {
    getSummaryMock.mockResolvedValue(createSummary({ is_finalized: false }));
    finalizeStoryMock.mockRejectedValue(new Error("finalize failed"));
    const user = userEvent.setup();

    render(<FeedbackPanel movieId={37} />);
    await screen.findByText("테마 #1");
    await user.click(screen.getByRole("button", { name: /생성/ }));

    expect(await screen.findByText(/영화 생성 요청 중 오류/)).toBeInTheDocument();
    expect(generateMock).not.toHaveBeenCalled();
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("summary 조회 실패 시 재시도할 수 있다", async () => {
    getSummaryMock
      .mockRejectedValueOnce(new Error("summary failed"))
      .mockResolvedValueOnce(createSummary({ is_finalized: false }));
    const user = userEvent.setup();

    render(<FeedbackPanel movieId={37} />);

    expect(await screen.findByText("요약 정보를 불러오지 못했습니다.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("테마 #1")).toBeInTheDocument();
    expect(getSummaryMock).toHaveBeenCalledTimes(2);
  });
});

function createSummary(overrides: Partial<SummaryResponse> = {}): SummaryResponse {
  return {
    prompt: "학창시절의 이야기를 담은 시나리오",
    files: [],
    theme: { theme_id: 1 },
    music: null,
    story_brief: null,
    scene_plan: [],
    generation_prompt: null,
    is_finalized: false,
    ...overrides,
  };
}
