import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearAuthSession,
  getAccessToken,
  getAuthSession,
  saveAuthSession,
} from "@/features/auth/session";
import type { AuthTokenResponse } from "@/features/auth/types";

const authResponse: AuthTokenResponse = {
  access_token: "access-token",
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

  it("access token을 메모리와 sessionStorage에 저장한다", () => {
    vi.setSystemTime(new Date("2026-05-07T00:00:00Z"));

    const session = saveAuthSession(authResponse);

    expect(session.accessToken).toBe("access-token");
    expect(session.expiresAt).toBe(Date.now() + 900_000);
    expect(getAccessToken()).toBe("access-token");
    expect(window.sessionStorage.getItem("my_life_movie.access_token")).toBe(
      "access-token",
    );
  });

  it("만료된 access token은 조회 시 정리한다", () => {
    vi.setSystemTime(new Date("2026-05-07T00:00:00Z"));
    saveAuthSession({
      ...authResponse,
      expires_in: -1,
    });

    expect(getAuthSession()).toBeNull();
    expect(window.sessionStorage.getItem("my_life_movie.access_token")).toBeNull();
  });
});
