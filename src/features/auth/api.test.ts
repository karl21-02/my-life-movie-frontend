import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  signup,
} from "@/features/auth/api";
import { apiClient } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiClient: vi.fn(),
}));

const apiClientMock = vi.mocked(apiClient);

describe("auth api", () => {
  beforeEach(() => {
    apiClientMock.mockReset();
  });

  it("signup 요청을 백엔드 계약에 맞게 보낸다", () => {
    signup({
      email: "user@example.com",
      password: "password123",
      display_name: "테스터",
    });

    expect(apiClientMock).toHaveBeenCalledWith("/auth/signup", {
      method: "POST",
      body: {
        email: "user@example.com",
        password: "password123",
        display_name: "테스터",
      },
    });
  });

  it("login 요청을 백엔드 계약에 맞게 보낸다", () => {
    login({
      email: "user@example.com",
      password: "password123",
    });

    expect(apiClientMock).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: {
        email: "user@example.com",
        password: "password123",
      },
    });
  });

  it("refresh와 logout은 refresh cookie 기반으로 호출한다", () => {
    refreshAccessToken();
    logout();

    expect(apiClientMock).toHaveBeenNthCalledWith(1, "/auth/refresh", {
      method: "POST",
    });
    expect(apiClientMock).toHaveBeenNthCalledWith(2, "/auth/logout", {
      method: "POST",
    });
  });

  it("me 요청에 Bearer access token을 포함한다", () => {
    getCurrentUser("access-token");

    expect(apiClientMock).toHaveBeenCalledWith("/auth/me", {
      method: "GET",
      headers: {
        Authorization: "Bearer access-token",
      },
    });
  });
});
