import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiClient, type ProblemDetails } from "@/lib/api";

describe("apiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("JSON 요청에 request id와 same-origin credentials를 기본으로 포함한다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-request-id": "req_test",
        },
      }),
    );

    const response = await apiClient<{ ok: boolean }>("/auth/login", {
      method: "POST",
      requestId: "req_test",
      body: {
        email: "user@example.com",
        password: "password123",
      },
    });

    const [, requestInit] = fetchSpy.mock.calls[0];
    const headers = requestInit?.headers as Headers;
    expect(response).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      }),
    );
    expect(headers.get("X-Request-ID")).toBe("req_test");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("Problem Details 응답을 ApiError로 변환한다", async () => {
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
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(problem), {
        status: 401,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    await expect(apiClient("/auth/login")).rejects.toMatchObject<ApiError>({
      name: "ApiError",
      problem,
    });
  });

  it("네트워크 실패를 ApiError로 변환한다", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      apiClient("/auth/api/login", {
        requestId: "req_network",
      }),
    ).rejects.toMatchObject<ApiError>({
      name: "ApiError",
      problem: expect.objectContaining({
        code: "NETWORK_ERROR",
        request_id: "req_network",
      }),
    });
  });
});
