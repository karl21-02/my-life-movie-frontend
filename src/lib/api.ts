import { logger } from "@/lib/logger";

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  request_id: string;
  errors: unknown[];
};

export type ApiClientOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  requestId?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

const REQUEST_ID_HEADER = "X-Request-ID";

function createRequestId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `req_${globalThis.crypto.randomUUID().replaceAll("-", "")}`;
  }

  return `req_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

function isJsonResponse(response: Response): boolean {
  return response.headers.get("content-type")?.includes("application/json") ?? false;
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ProblemDetails>;
  return (
    typeof candidate.type === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.status === "number" &&
    typeof candidate.detail === "string" &&
    typeof candidate.code === "string" &&
    typeof candidate.request_id === "string"
  );
}

export class ApiError extends Error {
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail);
    this.name = "ApiError";
    this.problem = problem;
  }
}

// 기능별 API client는 이 helper 위에 얇게 구성해 request id와 에러 파싱을 일관되게 유지한다.
export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const requestId = options.requestId ?? createRequestId();
  const headers = new Headers(options.headers);
  headers.set(REQUEST_ID_HEADER, requestId);

  const hasBody = options.body !== undefined;
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  logger.debug("api_request_started", {
    request_id: requestId,
    path,
    method: options.method ?? "GET",
  });

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const body = isJsonResponse(response) ? await response.json() : undefined;
    const problem = isProblemDetails(body)
      ? body
      : {
          type: "http_error",
          title: "HTTP Error",
          status: response.status,
          detail: response.statusText || "Request failed.",
          instance: path,
          code: "HTTP_ERROR",
          request_id: response.headers.get(REQUEST_ID_HEADER) ?? requestId,
          errors: [],
        };

    logger.warn("api_request_failed", {
      request_id: problem.request_id,
      path,
      method: options.method ?? "GET",
      status_code: problem.status,
      error_code: problem.code,
    });

    throw new ApiError(problem);
  }

  logger.debug("api_request_succeeded", {
    request_id: response.headers.get(REQUEST_ID_HEADER) ?? requestId,
    path,
    method: options.method ?? "GET",
    status_code: response.status,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (isJsonResponse(response)) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

// --- Types ---

export interface Theme {
  theme_id: number;
  name: string;
  description: string;
  preview_color: string;
}

export interface MusicTrack {
  music_id: number;
  title: string;
  file_url: string;
  is_ai_recommended: boolean;
}

export interface MusicListResponse {
  default_tracks: MusicTrack[];
  ai_recommended: MusicTrack[];
}

export interface ChatMessage {
  role: "user" | "ai";
  message: string;
}

export interface FileInfo {
  file_id: string;
  filename: string;
  type: string;
  extracted_text: string;
}

export interface SummaryResponse {
  prompt: string;
  files: FileInfo[];
  theme: { theme_id: number };
  music: { music_id: number } | null;
}

// --- API ---

export const api = {
  themes: {
    list: () => apiClient<Theme[]>("/api/v1/themes"),
  },

  music: {
    listByTheme: (themeId: number) =>
      apiClient<MusicListResponse>(`/api/v1/music?theme_id=${themeId}`),
    recommend: (movieId: number, message: string) =>
      apiClient<{ ai_message: string; tracks: MusicTrack[] }>(
        "/api/v1/music/recommend",
        { method: "POST", body: { movie_id: movieId, message } },
      ),
  },

  movies: {
    createDraft: (themeId: number) =>
      apiClient<{ movie_id: number; status: string }>("/api/v1/movies/draft", {
        method: "POST",
        body: { theme_id: themeId },
      }),
    updateMusic: (movieId: number, musicId: number) =>
      apiClient(`/api/v1/movies/${movieId}/music`, {
        method: "PUT",
        body: { music_id: musicId },
      }),
    uploadFile: async (movieId: number, file: File): Promise<FileInfo> => {
      const requestId = `req_${Date.now().toString(36)}`;
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(
        `${API_BASE_URL}/api/v1/movies/${movieId}/files`,
        {
          method: "POST",
          headers: { [REQUEST_ID_HEADER]: requestId },
          body: form,
        },
      );
      if (!response.ok) {
        const body = isJsonResponse(response)
          ? await response.json()
          : undefined;
        const problem = isProblemDetails(body)
          ? body
          : {
              type: "http_error",
              title: "Upload Failed",
              status: response.status,
              detail: response.statusText || "파일 업로드에 실패했습니다.",
              instance: `/api/v1/movies/${movieId}/files`,
              code: "HTTP_ERROR",
              request_id: requestId,
              errors: [],
            };
        throw new ApiError(problem);
      }
      return response.json() as Promise<FileInfo>;
    },
    chat: (movieId: number, message: string) =>
      apiClient<{ ai_question: string; current_draft: string }>(
        `/api/v1/movies/${movieId}/chat`,
        { method: "POST", body: { message } },
      ),
    getChatHistory: (movieId: number) =>
      apiClient<{ history: ChatMessage[] }>(`/api/v1/movies/${movieId}/chat`),
    getSummary: (movieId: number) =>
      apiClient<SummaryResponse>(`/api/v1/movies/${movieId}/summary`),
    generate: (movieId: number) =>
      apiClient(`/api/v1/movies/${movieId}/generate`, { method: "POST" }),
  },
};
