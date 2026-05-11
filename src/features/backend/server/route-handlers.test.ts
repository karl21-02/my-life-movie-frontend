import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { handleBackendApiRequest } from "@/features/backend/server/route-handlers";

describe("backend API proxy route handlers", () => {
  beforeEach(() => {
    process.env.SERVER_API_BASE_URL = "http://backend.local";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SERVER_API_BASE_URL;
  });

  it("GET 요청을 백엔드 API로 프록시한다", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      Response.json([{ theme_id: 1, name: "하이틴" }], {
        headers: { "x-request-id": "req_proxy" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const request = new NextRequest("http://localhost/api/v1/themes?theme_id=1", {
      headers: { "x-request-id": "req_proxy" },
    });

    const response = await handleBackendApiRequest(request, {
      params: Promise.resolve({ path: ["v1", "themes"] }),
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://backend.local/api/v1/themes?theme_id=1",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("req_proxy");
    await expect(response.json()).resolves.toEqual([
      { theme_id: 1, name: "하이틴" },
    ]);
  });

  it("HttpOnly access token cookie를 Authorization 헤더로 전달한다", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      Response.json({ movie_id: 1, status: "DRAFT" }, { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const request = new NextRequest("http://localhost/api/movies/draft", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "my_life_movie.access_token=access-token",
      },
      body: JSON.stringify({ theme_id: 1 }),
    });

    const response = await handleBackendApiRequest(request, {
      params: Promise.resolve({ path: ["movies", "draft"] }),
    });
    const [, requestInit] = fetchSpy.mock.calls[0];
    const headers = requestInit.headers as Headers;

    expect(response.status).toBe(201);
    expect(headers.get("authorization")).toBe("Bearer access-token");
    expect(headers.get("content-type")).toBe("application/json");
    expect(await new Response(requestInit.body).json()).toEqual({ theme_id: 1 });
  });

  it("백엔드 통신 실패를 Problem Details 응답으로 변환한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const request = new NextRequest("http://localhost/api/v1/themes", {
      headers: { "x-request-id": "req_failed" },
    });

    const response = await handleBackendApiRequest(request, {
      params: Promise.resolve({ path: ["v1", "themes"] }),
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      code: "BACKEND_UNAVAILABLE",
      request_id: "req_failed",
    });
  });
});
