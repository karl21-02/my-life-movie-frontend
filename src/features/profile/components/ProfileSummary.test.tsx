import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, type ProblemDetails } from "@/lib/api";
import { ProfileSummary } from "@/features/profile/components/ProfileSummary";
import {
  loadCurrentUser,
  logoutCurrentUser,
} from "@/features/auth/session-actions";
import type { AuthUser } from "@/features/auth/types";

const routerReplaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplaceMock,
  }),
}));

vi.mock("@/features/auth/session-actions", () => ({
  loadCurrentUser: vi.fn(),
  logoutCurrentUser: vi.fn(),
}));

const loadCurrentUserMock = vi.mocked(loadCurrentUser);
const logoutCurrentUserMock = vi.mocked(logoutCurrentUser);

const user: AuthUser = {
  id: 1,
  email: "user@example.com",
  display_name: "테스터",
  role: "USER",
  status: "ACTIVE",
  created_at: "2026-05-07T00:00:00Z",
  updated_at: "2026-05-07T00:00:00Z",
};

describe("ProfileSummary", () => {
  beforeEach(() => {
    loadCurrentUserMock.mockReset();
    logoutCurrentUserMock.mockReset();
    routerReplaceMock.mockReset();
  });

  it("현재 사용자 프로필 정보를 보여준다", async () => {
    loadCurrentUserMock.mockResolvedValue(user);

    render(<ProfileSummary />);

    expect(await screen.findByText("테스터")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("USER")).toBeInTheDocument();
  });

  it("인증되지 않은 사용자는 로그인 경로를 안내한다", async () => {
    loadCurrentUserMock.mockRejectedValue(createAuthError("AUTH_REQUIRED"));

    render(<ProfileSummary />);

    expect(await screen.findByText("로그인이 필요합니다")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "로그인으로 이동" })).toHaveAttribute(
      "href",
      "/auth/login?next=%2Fprofile",
    );
  });

  it("로그아웃 후 로그인 화면으로 이동한다", async () => {
    loadCurrentUserMock.mockResolvedValue(user);
    logoutCurrentUserMock.mockResolvedValue();
    const viewer = userEvent.setup();

    render(<ProfileSummary />);
    await viewer.click(await screen.findByRole("button", { name: "로그아웃" }));

    expect(logoutCurrentUserMock).toHaveBeenCalled();
    expect(routerReplaceMock).toHaveBeenCalledWith("/auth/login?next=%2Fprofile");
  });
});

function createAuthError(code: string): ApiError {
  const problem: ProblemDetails = {
    type: "auth_error",
    title: "Auth Error",
    status: 401,
    detail: "인증이 필요합니다.",
    instance: "/auth/me",
    code,
    request_id: "req_profile",
    errors: [],
  };
  return new ApiError(problem);
}
