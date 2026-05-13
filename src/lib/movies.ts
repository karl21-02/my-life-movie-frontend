import { apiClient } from "@/lib/api";
import type { Movie, MovieSummary, OstTrack, SimilarMovie } from "@/types/movie";

const MOVIES_API_BASE_PATH = "/api/movies";

type ApiOstTrack = {
  title: string;
  artist: string;
  spotify_url?: string | null;
};

type ApiSimilarMovie = {
  id: number;
  title: string;
  thumbnail: string;
};

type ApiMovieSummary = {
  id: number;
  title: string;
  thumbnail?: string | null;
  genre: string;
  status: string;
  output_url?: string | null;
  thumbnail_url?: string | null;
};

type ApiMovie = ApiMovieSummary & {
  description: string;
  sentiment: string;
  ost: ApiOstTrack[];
  similar_movies: ApiSimilarMovie[];
};

type DownloadMovieResponse = {
  message: string;
  output_url?: string | null;
};

export async function getMovies(): Promise<MovieSummary[]> {
  const movies = await apiClient<ApiMovieSummary[]>(MOVIES_API_BASE_PATH, {
    baseUrl: "",
  });
  return movies.map(normalizeMovieSummary);
}

export async function getMovie(id: number): Promise<Movie> {
  const movie = await apiClient<ApiMovie>(`${MOVIES_API_BASE_PATH}/${id}`, {
    baseUrl: "",
  });
  return normalizeMovie(movie);
}

export async function deleteMovie(id: number): Promise<void> {
  return apiClient<void>(`${MOVIES_API_BASE_PATH}/${id}`, {
    baseUrl: "",
    method: "DELETE",
  });
}

export async function downloadMovie(id: number): Promise<DownloadMovieResponse> {
  return apiClient<DownloadMovieResponse>(`${MOVIES_API_BASE_PATH}/${id}/download`, {
    baseUrl: "",
  });
}

export async function shareMovie(id: number): Promise<{ share_url: string; message: string }> {
  return apiClient<{ share_url: string; message: string }>(`${MOVIES_API_BASE_PATH}/${id}/share`, {
    baseUrl: "",
    method: "POST",
  });
}

function normalizeMovieSummary(movie: ApiMovieSummary): MovieSummary {
  const thumbnailUrl = normalizeOptionalUrl(movie.thumbnail_url);
  return {
    id: movie.id,
    title: movie.title,
    thumbnail: thumbnailUrl ?? normalizeOptionalUrl(movie.thumbnail),
    genre: movie.genre,
    status: movie.status,
    outputUrl: normalizeOptionalUrl(movie.output_url),
    thumbnailUrl,
  };
}

function normalizeMovie(movie: ApiMovie): Movie {
  const summary = normalizeMovieSummary(movie);
  return {
    ...summary,
    description: movie.description,
    sentiment: movie.sentiment,
    ost: (movie.ost ?? []).map(normalizeOstTrack),
    similarMovies: (movie.similar_movies ?? []).map(normalizeSimilarMovie),
  };
}

function normalizeOstTrack(track: ApiOstTrack): OstTrack {
  return {
    title: track.title,
    artist: track.artist,
    spotifyUrl: normalizeOptionalUrl(track.spotify_url),
  };
}

function normalizeSimilarMovie(movie: ApiSimilarMovie): SimilarMovie {
  return {
    id: movie.id,
    title: movie.title,
    thumbnail: movie.thumbnail,
  };
}

function normalizeOptionalUrl(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith("https://cdn.mylifemovie.local/")) {
    return undefined;
  }
  return trimmed;
}
