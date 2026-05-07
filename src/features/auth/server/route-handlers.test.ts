import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  handleAuthApiGet,
  handleAuthApiPost,
} from "@/features/auth/server/route-handlers";
import type { AuthTokenResponse, AuthUser } from "@/features/auth/types";

const user: AuthUser = {
  id: 1,
  email: "user@example.com",
  display_name: "테스터",
  role: "USER",
  status: "ACTIVE",
  created_at: "2026-05-07T00:00:00Z",
  updated_at: "2026-05-07T00:00:00Z",
};

const backendAuthResponse: AuthTokenResponse = {
  access_token: "access-token",
  token_type: "bearer",
  expires_in: 900,
  user,
};

describe("auth route handlers", () => {
  beforeEach(() => {
    process.env.SERVER_API_BASE_URL = "http://backend.local";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SERVER_API_BASE_URL;
  });

  it("login은 백엔드 access token을 HttpOnly cookie로 숨기고 body에서 제거한다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(backendAuthResponse), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-request-id": "req_login",
          "set-cookie": "refresh_token=refresh; HttpOnly; Path=/auth",
        },
      }),
    );
    const request = createJsonRequest("/auth/api/login", {
      email: "user@example.com",
      password: "password123",
    });

    const response = await handleAuthApiPost(request, "login");
    const body = await response.json();
    const [, requestInit] = fetchSpy.mock.calls[0];
    const headers = requestInit?.headers as Headers;

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://backend.local/auth/login",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
      }),
    );
    expect(headers.get("X-Request-ID")).toBe("req_test");
    expect(body).toEqual({
      token_type: "bearer",
      expires_in: 900,
      user,
    });
    expect(JSON.stringify(body)).not.toContain("access-token");
    expect(response.headers.get("set-cookie")).toContain(
      "my_life_movie.access_token=access-token",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("refresh는 refresh cookie를 백엔드로 전달한다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(backendAuthResponse), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    const request = createJsonRequest("/auth/api/refresh", undefined, {
      cookie: "refresh_token=raw-refresh-token",
    });

    await handleAuthApiPost(request, "refresh");

    const [, requestInit] = fetchSpy.mock.calls[0];
    const headers = requestInit?.headers as Headers;
    expect(headers.get("Cookie")).toBe("refresh_token=raw-refresh-token");
  });

  it("me는 HttpOnly access cookie를 Bearer header로 백엔드에 전달한다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ user }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    const request = new NextRequest("http://localhost/auth/api/me", {
      method: "GET",
      headers: {
        cookie: "my_life_movie.access_token=access-token",
        "x-request-id": "req_test",
      },
    });

    const response = await handleAuthApiGet(request, "me");

    const [, requestInit] = fetchSpy.mock.calls[0];
    const headers = requestInit?.headers as Headers;
    expect(response.status).toBe(200);
    expect(headers.get("Authorization")).toBe("Bearer access-token");
  });

  it("me access cookie가 없으면 AUTH_REQUIRED를 반환한다", async () => {
    const request = new NextRequest("http://localhost/auth/api/me", {
      method: "GET",
      headers: {
        "x-request-id": "req_missing",
      },
    });

    const response = await handleAuthApiGet(request, "me");
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.code).toBe("AUTH_REQUIRED");
    expect(body.request_id).toBe("req_missing");
  });

  it("백엔드 통신 실패는 BACKEND_UNAVAILABLE로 정규화한다", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    const request = createJsonRequest("/auth/api/login", {
      email: "user@example.com",
      password: "password123",
    });

    const response = await handleAuthApiPost(request, "login");
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.code).toBe("BACKEND_UNAVAILABLE");
    expect(body.request_id).toBe("req_test");
  });
});

function createJsonRequest(
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_test",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
