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
  getAccessToken,
  saveAuthSession,
} from "@/features/auth/session";
import type { AuthTokenResponse, AuthUser } from "@/features/auth/types";

vi.mock("@/features/auth/api", () => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

vi.mock("@/features/auth/session", () => ({
  clearAuthSession: vi.fn(),
  getAccessToken: vi.fn(),
  saveAuthSession: vi.fn(),
}));

const getCurrentUserMock = vi.mocked(getCurrentUser);
const logoutMock = vi.mocked(logout);
const refreshAccessTokenMock = vi.mocked(refreshAccessToken);
const clearAuthSessionMock = vi.mocked(clearAuthSession);
const getAccessTokenMock = vi.mocked(getAccessToken);
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

const authResponse: AuthTokenResponse = {
  access_token: "new-access-token",
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
    getAccessTokenMock.mockReset();
    saveAuthSessionMock.mockReset();
  });

  it("refreshAuthSession은 새 access token을 저장하고 사용자를 반환한다", async () => {
    refreshAccessTokenMock.mockResolvedValue(authResponse);

    const result = await refreshAuthSession();

    expect(refreshAccessTokenMock).toHaveBeenCalled();
    expect(saveAuthSessionMock).toHaveBeenCalledWith(authResponse);
    expect(result).toEqual(user);
  });

  it("access token이 있으면 me API로 현재 사용자를 조회한다", async () => {
    getAccessTokenMock.mockReturnValue("access-token");
    getCurrentUserMock.mockResolvedValue({ user });

    const result = await loadCurrentUser();

    expect(getCurrentUserMock).toHaveBeenCalledWith("access-token");
    expect(refreshAccessTokenMock).not.toHaveBeenCalled();
    expect(result).toEqual(user);
  });

  it("access token이 없으면 refresh API로 세션을 복구한다", async () => {
    getAccessTokenMock.mockReturnValue(null);
    refreshAccessTokenMock.mockResolvedValue(authResponse);

    const result = await loadCurrentUser();

    expect(refreshAccessTokenMock).toHaveBeenCalled();
    expect(saveAuthSessionMock).toHaveBeenCalledWith(authResponse);
    expect(result).toEqual(user);
  });

  it("만료된 access token이면 세션을 비우고 refresh를 재시도한다", async () => {
    getAccessTokenMock.mockReturnValue("expired-access-token");
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
