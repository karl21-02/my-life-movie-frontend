import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ThemeGrid from "@/app/create/ThemeGrid";
import { ApiError, api, type ProblemDetails, type Theme } from "@/lib/api";

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
        createDraft: vi.fn(),
      },
    },
  };
});

const createDraftMock = vi.mocked(api.movies.createDraft);

const themes: Theme[] = [
  {
    theme_id: 1,
    name: "하이틴",
    description: "밝고 경쾌한 성장 영화",
    preview_color: "#e3b65a",
  },
];

describe("ThemeGrid", () => {
  beforeEach(() => {
    createDraftMock.mockReset();
    routerPushMock.mockReset();
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("테마 선택 성공 시 생성된 영화의 음악 선택 화면으로 이동한다", async () => {
    createDraftMock.mockResolvedValue({ movie_id: 10, status: "DRAFT" });
    const user = userEvent.setup();

    render(<ThemeGrid themes={themes} />);
    await user.click(screen.getByRole("button", { name: /하이틴/ }));

    expect(createDraftMock).toHaveBeenCalledWith(1);
    expect(routerPushMock).toHaveBeenCalledWith("/create/10/music?theme_id=1");
    expect(window.alert).not.toHaveBeenCalled();
  });

  it("테마 선택 중 인증 필요 응답을 받으면 로그인 화면으로 이동한다", async () => {
    createDraftMock.mockRejectedValue(new ApiError(createAuthRequiredProblem()));
    const user = userEvent.setup();

    render(<ThemeGrid themes={themes} />);
    await user.click(screen.getByRole("button", { name: /하이틴/ }));

    expect(routerPushMock).toHaveBeenCalledWith("/auth/login?next=%2Fcreate");
    expect(window.alert).not.toHaveBeenCalled();
  });
});

function createAuthRequiredProblem(): ProblemDetails {
  return {
    type: "auth_required",
    title: "Auth Required",
    status: 401,
    detail: "Bearer access token이 필요합니다.",
    instance: "/api/movies/draft",
    code: "AUTH_REQUIRED",
    request_id: "req_auth",
    errors: [],
  };
}
