import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiClient: vi.fn(),
}));

const apiClientMock = vi.mocked(apiClient);

describe("movies API", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.USE_MOCK_MOVIES;
  });

  it("mock 비활성화 시 영화 목록을 BFF 경로로 요청한다", async () => {
    process.env.USE_MOCK_MOVIES = "false";
    apiClientMock.mockResolvedValue([]);
    const { getMovies } = await import("@/lib/movies");

    await getMovies();

    expect(apiClientMock).toHaveBeenCalledWith("/api/movies");
  });

  it("mock 비활성화 시 영화 상세/액션 요청도 BFF 경로를 사용한다", async () => {
    process.env.USE_MOCK_MOVIES = "false";
    apiClientMock.mockResolvedValue({});
    const {
      deleteMovie,
      downloadMovie,
      getMovie,
      shareMovie,
    } = await import("@/lib/movies");

    await getMovie(1);
    await deleteMovie(1);
    await downloadMovie(1);
    await shareMovie(1);

    expect(apiClientMock).toHaveBeenNthCalledWith(1, "/api/movies/1");
    expect(apiClientMock).toHaveBeenNthCalledWith(2, "/api/movies/1", {
      method: "DELETE",
    });
    expect(apiClientMock).toHaveBeenNthCalledWith(3, "/api/movies/1/download");
    expect(apiClientMock).toHaveBeenNthCalledWith(4, "/api/movies/1/share", {
      method: "POST",
    });
  });
});
