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
  });

  it("영화 목록을 BFF 경로로 요청한다", async () => {
    apiClientMock.mockResolvedValue([]);
    const { getMovies } = await import("@/lib/movies");

    await getMovies();

    expect(apiClientMock).toHaveBeenCalledWith("/api/movies", { baseUrl: "" });
  });

  it("영화 상세/액션 요청도 BFF 경로를 사용한다", async () => {
    apiClientMock.mockResolvedValue({});
    const {
      deleteMovie,
      downloadMovie,
      getMovieDownloadFileUrl,
      getMovie,
      shareMovie,
    } = await import("@/lib/movies");

    await getMovie(1);
    await deleteMovie(1);
    await downloadMovie(1);
    await shareMovie(1);

    expect(apiClientMock).toHaveBeenNthCalledWith(1, "/api/movies/1", {
      baseUrl: "",
    });
    expect(apiClientMock).toHaveBeenNthCalledWith(2, "/api/movies/1", {
      baseUrl: "",
      method: "DELETE",
    });
    expect(apiClientMock).toHaveBeenNthCalledWith(3, "/api/movies/1/download", {
      baseUrl: "",
    });
    expect(apiClientMock).toHaveBeenNthCalledWith(4, "/api/movies/1/share", {
      baseUrl: "",
      method: "POST",
    });
    expect(getMovieDownloadFileUrl(1, "/api/movies/1/download/file")).toBe(
      "/api/movies/1/download/file",
    );
    expect(getMovieDownloadFileUrl(1, null)).toBe("/api/movies/1/download/file");
  });

  it("snake_case 영화 응답을 camelCase 화면 모델로 변환한다", async () => {
    apiClientMock.mockResolvedValue({
      id: 3,
      title: "나의 영화",
      thumbnail: "",
      genre: "하이틴",
      status: "COMPLETED",
      output_url: "/generated/videos/video_123.mp4",
      thumbnail_url: "/generated/thumbnails/video_123.webp",
      description: "설명",
      sentiment: "따뜻함",
      ost: [
        {
          title: "OST",
          artist: "Artist",
          spotify_url: "https://open.spotify.com/track/1",
        },
      ],
      similar_movies: [
        {
          id: 2,
          title: "비슷한 영화",
          thumbnail: "/thumb.webp",
          external_url: "https://www.themoviedb.org/movie/2",
          provider: "tmdb",
        },
      ],
    });
    const { getMovie } = await import("@/lib/movies");

    const movie = await getMovie(3);

    expect(movie.outputUrl).toBe("/generated/videos/video_123.mp4");
    expect(movie.thumbnailUrl).toBe("/generated/thumbnails/video_123.webp");
    expect(movie.ost[0].spotifyUrl).toBe("https://open.spotify.com/track/1");
    expect(movie.similarMovies[0].title).toBe("비슷한 영화");
    expect(movie.similarMovies[0].externalUrl).toBe("https://www.themoviedb.org/movie/2");
    expect(movie.similarMovies[0].provider).toBe("tmdb");
  });
});
