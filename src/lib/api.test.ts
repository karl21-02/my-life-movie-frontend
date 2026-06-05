import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, api, apiClient, type ProblemDetails } from "@/lib/api";

describe("apiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.SERVER_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
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

  it("브라우저 런타임에서는 NEXT_PUBLIC_API_BASE_URL이 있어도 같은 출처 BFF를 호출한다", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8000";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ movie_id: 1, status: "DRAFT" }), {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    await apiClient("/api/movies/draft", {
      method: "POST",
      body: { theme_id: 1 },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/movies/draft",
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

  it("일반 API가 인증 만료 응답을 받으면 refresh 후 한 번 재시도한다", async () => {
    const authRequiredProblem: ProblemDetails = {
      type: "auth_required",
      title: "Auth Required",
      status: 401,
      detail: "Bearer access token이 필요합니다.",
      instance: "/api/movies/3/chat",
      code: "AUTH_REQUIRED",
      request_id: "req_chat",
      errors: [],
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(authRequiredProblem), {
          status: 401,
          headers: {
            "content-type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ expires_in: 900 }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ai_question: "더 들려주세요." }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const response = await apiClient<{ ai_question: string }>("/api/movies/3/chat", {
      method: "POST",
      body: { message: "졸업식 이야기" },
      requestId: "req_chat",
    });

    expect(response.ai_question).toBe("더 들려주세요.");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "/api/auth/refresh",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
      }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      "/api/movies/3/chat",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("기본 refresh가 실패하면 legacy refresh 경로로 복구 후 재시도한다", async () => {
    const authRequiredProblem: ProblemDetails = {
      type: "auth_required",
      title: "Auth Required",
      status: 401,
      detail: "Bearer access token이 필요합니다.",
      instance: "/api/movies/3/chat",
      code: "AUTH_REQUIRED",
      request_id: "req_chat",
      errors: [],
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify(authRequiredProblem), {
          status: 401,
          headers: {
            "content-type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(authRequiredProblem), {
          status: 401,
          headers: {
            "content-type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ expires_in: 900 }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ai_question: "더 들려주세요." }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const response = await apiClient<{ ai_question: string }>("/api/movies/3/chat", {
      method: "POST",
      body: { message: "졸업식 이야기" },
      requestId: "req_chat",
    });

    expect(response.ai_question).toBe("더 들려주세요.");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "/api/auth/refresh",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      "/auth/refresh",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      4,
      "/api/movies/3/chat",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("인증 API 자체의 401은 refresh 재시도를 하지 않는다", async () => {
    const authRequiredProblem: ProblemDetails = {
      type: "auth_required",
      title: "Auth Required",
      status: 401,
      detail: "refresh token이 필요합니다.",
      instance: "/api/auth/refresh",
      code: "AUTH_REQUIRED",
      request_id: "req_refresh",
      errors: [],
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(authRequiredProblem), {
        status: 401,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    await expect(apiClient("/api/auth/refresh", {
      method: "POST",
      requestId: "req_refresh",
    })).rejects.toMatchObject<ApiError>({
      problem: authRequiredProblem,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
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

  it("finalizeStory는 영화 생성용 시나리오 확정 API를 호출한다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ is_finalized: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    await api.movies.finalizeStory(3);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/movies/3/finalize-story",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
