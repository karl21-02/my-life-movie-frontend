import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, type ProblemDetails } from "@/lib/api";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { login, signup } from "@/features/auth/api";
import { saveAuthSession } from "@/features/auth/session";
import type { AuthSessionResponse } from "@/features/auth/types";

const routerReplaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplaceMock,
  }),
}));

vi.mock("@/features/auth/api", () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

vi.mock("@/features/auth/session", () => ({
  saveAuthSession: vi.fn(),
}));

const loginMock = vi.mocked(login);
const signupMock = vi.mocked(signup);
const saveAuthSessionMock = vi.mocked(saveAuthSession);

const authResponse: AuthSessionResponse = {
  token_type: "bearer",
  expires_in: 900,
  user: {
    id: 1,
    email: "user@example.com",
    display_name: "테스터",
    role: "USER",
    status: "ACTIVE",
    created_at: "2026-05-07T00:00:00Z",
    updated_at: "2026-05-07T00:00:00Z",
  },
};

describe("AuthForm", () => {
  beforeEach(() => {
    loginMock.mockReset();
    signupMock.mockReset();
    saveAuthSessionMock.mockReset();
    routerReplaceMock.mockReset();
  });

  it("로그인 성공 시 인증 세션을 저장하고 영화 목록으로 이동한다", async () => {
    loginMock.mockResolvedValue(authResponse);
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password123");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(loginMock).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
    expect(saveAuthSessionMock).toHaveBeenCalledWith(authResponse);
    expect(routerReplaceMock).toHaveBeenCalledWith("/movies");
    expect(
      await screen.findByText("로그인되었습니다. 이제 나의 영화 만들기를 이어갈 수 있습니다."),
    ).toBeInTheDocument();
  });

  it("회원가입 성공 시 display name을 포함해 요청하고 영화 생성 화면으로 이동한다", async () => {
    signupMock.mockResolvedValue(authResponse);
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText("이름"), "테스터");
    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password123");
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(signupMock).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
      display_name: "테스터",
    });
    expect(saveAuthSessionMock).toHaveBeenCalledWith(authResponse);
    expect(routerReplaceMock).toHaveBeenCalledWith("/create");
  });

  it("next query가 안전한 내부 경로이면 로그인 성공 후 해당 경로로 이동한다", async () => {
    loginMock.mockResolvedValue(authResponse);
    const user = userEvent.setup();
    render(<AuthForm mode="login" nextPath="/create?theme_id=1" />);

    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password123");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(routerReplaceMock).toHaveBeenCalledWith("/create?theme_id=1");
  });

  it("JS 로드 전 기본 제출에서도 비밀번호가 URL query로 노출되지 않도록 post method를 사용한다", () => {
    render(<AuthForm mode="signup" />);

    expect(document.querySelector("form")).toHaveAttribute("method", "post");
  });

  it("Problem Details 에러 메시지를 사용자에게 보여준다", async () => {
    const problem: ProblemDetails = {
      type: "invalid_credentials",
      title: "Invalid Credentials",
      status: 401,
      detail: "이메일 또는 비밀번호가 올바르지 않습니다.",
      instance: "/auth/login",
      code: "INVALID_CREDENTIALS",
      request_id: "req_error",
      errors: [],
    };
    loginMock.mockRejectedValue(new ApiError(problem));
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("이메일"), "user@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("이메일 또는 비밀번호가 올바르지 않습니다.");
    expect(saveAuthSessionMock).not.toHaveBeenCalled();
    expect(routerReplaceMock).not.toHaveBeenCalled();
  });
});
