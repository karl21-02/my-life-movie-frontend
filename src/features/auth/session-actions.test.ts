import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, type ProblemDetails } from "@/lib/api";
import {
  loadCurrentUser,
  logoutCurrentUser,
  refreshAuthSession,
} from "@/features/auth/session-actions";
import {
  getCurrentUser,
  logout,
  refreshAccessToken,
} from "@/features/auth/api";
import {
  clearAuthSession,
  saveAuthSession,
} from "@/features/auth/session";
import type { AuthSessionResponse, AuthUser } from "@/features/auth/types";

vi.mock("@/features/auth/api", () => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

vi.mock("@/features/auth/session", () => ({
  clearAuthSession: vi.fn(),
  saveAuthSession: vi.fn(),
}));

const getCurrentUserMock = vi.mocked(getCurrentUser);
const logoutMock = vi.mocked(logout);
const refreshAccessTokenMock = vi.mocked(refreshAccessToken);
const clearAuthSessionMock = vi.mocked(clearAuthSession);
const saveAuthSessionMock = vi.mocked(saveAuthSession);

const user: AuthUser = {
  id: 1,
  email: "user@example.com",
  display_name: "테스터",
  role: "USER",
  status: "ACTIVE",
  created_at: "2026-05-07T00:00:00Z",
  updated_at: "2026-05-07T00:00:00Z",
};

const authResponse: AuthSessionResponse = {
  token_type: "bearer",
  expires_in: 900,
  user,
};

describe("auth session actions", () => {
  beforeEach(() => {
    getCurrentUserMock.mockReset();
    logoutMock.mockReset();
    refreshAccessTokenMock.mockReset();
    clearAuthSessionMock.mockReset();
    saveAuthSessionMock.mockReset();
  });

  it("refreshAuthSession은 새 access token을 저장하고 사용자를 반환한다", async () => {
    refreshAccessTokenMock.mockResolvedValue(authResponse);

    const result = await refreshAuthSession();

    expect(refreshAccessTokenMock).toHaveBeenCalled();
    expect(saveAuthSessionMock).toHaveBeenCalledWith(authResponse);
    expect(result).toEqual(user);
  });

  it("me API로 현재 사용자를 조회한다", async () => {
    getCurrentUserMock.mockResolvedValue({ user });

    const result = await loadCurrentUser();

    expect(getCurrentUserMock).toHaveBeenCalled();
    expect(refreshAccessTokenMock).not.toHaveBeenCalled();
    expect(result).toEqual(user);
  });

  it("access cookie가 없으면 refresh API로 세션을 복구한다", async () => {
    getCurrentUserMock.mockRejectedValue(createAuthError("AUTH_REQUIRED"));
    refreshAccessTokenMock.mockResolvedValue(authResponse);

    const result = await loadCurrentUser();

    expect(clearAuthSessionMock).toHaveBeenCalled();
    expect(refreshAccessTokenMock).toHaveBeenCalled();
    expect(saveAuthSessionMock).toHaveBeenCalledWith(authResponse);
    expect(result).toEqual(user);
  });

  it("동시에 세션 복구가 들어와도 refresh API는 한 번만 호출한다", async () => {
    refreshAccessTokenMock.mockResolvedValue(authResponse);

    const [firstUser, secondUser] = await Promise.all([
      refreshAuthSession(),
      refreshAuthSession(),
    ]);

    expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(firstUser).toEqual(user);
    expect(secondUser).toEqual(user);
  });

  it("만료된 access cookie이면 세션을 비우고 refresh를 재시도한다", async () => {
    getCurrentUserMock.mockRejectedValue(createAuthError("INVALID_ACCESS_TOKEN"));
    refreshAccessTokenMock.mockResolvedValue(authResponse);

    const result = await loadCurrentUser();

    expect(clearAuthSessionMock).toHaveBeenCalled();
    expect(refreshAccessTokenMock).toHaveBeenCalled();
    expect(result).toEqual(user);
  });

  it("logout API 실패 여부와 관계없이 로컬 세션을 비운다", async () => {
    logoutMock.mockRejectedValue(new Error("network error"));

    await expect(logoutCurrentUser()).rejects.toThrow("network error");

    expect(clearAuthSessionMock).toHaveBeenCalled();
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
    request_id: "req_test",
    errors: [],
  };
  return new ApiError(problem);
}
