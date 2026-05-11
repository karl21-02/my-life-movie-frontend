import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiClient, type ProblemDetails } from "@/lib/api";

describe("apiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.SERVER_API_BASE_URL;
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

  it("baseUrl을 비우면 상대 경로를 그대로 호출한다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    await apiClient("/api/auth/signup", {
      baseUrl: "",
      method: "POST",
      body: {
        email: "user@example.com",
      },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/signup",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("서버 런타임에서는 SERVER_API_BASE_URL을 기본 baseUrl로 사용한다", async () => {
    vi.stubGlobal("window", undefined);
    process.env.SERVER_API_BASE_URL = "http://backend.local/";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ theme_id: 1 }]), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    await apiClient("/api/v1/themes");

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://backend.local/api/v1/themes",
      expect.objectContaining({
        credentials: "same-origin",
      }),
    );
  });

  it("FormData 요청은 공용 API client로 보내고 Content-Type을 직접 지정하지 않는다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ file_id: "file_1" }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );
    const form = new FormData();
    form.append("file", new File(["hello"], "hello.txt"));

    const response = await apiClient<{ file_id: string }>("/api/movies/1/files", {
      method: "POST",
      body: form,
      requestId: "req_upload",
    });

    const [, requestInit] = fetchSpy.mock.calls[0];
    const headers = requestInit?.headers as Headers;
    expect(response).toEqual({ file_id: "file_1" });
    expect(requestInit?.body).toBe(form);
    expect(headers.get("Content-Type")).toBeNull();
    expect(headers.get("X-Request-ID")).toBe("req_upload");
  });

  it("body가 있는 GET 요청은 fetch 전에 ApiError로 거부한다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      apiClient("/api/v1/themes", {
        body: { theme_id: 1 },
        requestId: "req_invalid",
      }),
    ).rejects.toMatchObject<ApiError>({
      name: "ApiError",
      problem: expect.objectContaining({
        code: "INVALID_REQUEST_BODY",
        request_id: "req_invalid",
      }),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
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
      apiClient("/api/auth/login", {
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
