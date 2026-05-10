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

    expect(apiClientMock).toHaveBeenCalledWith("/api/auth/signup", {
      baseUrl: "",
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

    expect(apiClientMock).toHaveBeenCalledWith("/api/auth/login", {
      baseUrl: "",
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

    expect(apiClientMock).toHaveBeenNthCalledWith(1, "/api/auth/refresh", {
      baseUrl: "",
      method: "POST",
    });
    expect(apiClientMock).toHaveBeenNthCalledWith(2, "/api/auth/logout", {
      baseUrl: "",
      method: "POST",
    });
  });

  it("me 요청은 same-origin 인증 API로 호출한다", () => {
    getCurrentUser();

    expect(apiClientMock).toHaveBeenCalledWith("/api/auth/me", {
      baseUrl: "",
      method: "GET",
    });
  });
});
