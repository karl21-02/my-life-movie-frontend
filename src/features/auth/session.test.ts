import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from "@/features/auth/session";
import type { AuthSessionResponse } from "@/features/auth/types";

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

describe("auth session", () => {
  afterEach(() => {
    vi.useRealTimers();
    clearAuthSession();
    window.sessionStorage.clear();
  });

  it("인증 사용자와 만료 시점을 메모리와 sessionStorage에 저장한다", () => {
    vi.setSystemTime(new Date("2026-05-07T00:00:00Z"));

    const session = saveAuthSession(authResponse);

    expect(session.user).toEqual(authResponse.user);
    expect(session.expiresAt).toBe(Date.now() + 900_000);
    expect(getAuthSession()?.user).toEqual(authResponse.user);
    expect(window.sessionStorage.getItem("my_life_movie.auth_user")).toBe(
      JSON.stringify(authResponse.user),
    );
  });

  it("만료된 인증 세션은 조회 시 정리한다", () => {
    vi.setSystemTime(new Date("2026-05-07T00:00:00Z"));
    saveAuthSession({
      ...authResponse,
      expires_in: -1,
    });

    expect(getAuthSession()).toBeNull();
    expect(window.sessionStorage.getItem("my_life_movie.auth_user")).toBeNull();
  });
});
