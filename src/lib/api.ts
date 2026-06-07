import { logger } from "@/lib/logger";
import { createRequestId, REQUEST_ID_HEADER } from "@/lib/request-id";

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
  baseUrl?: string;
  body?: unknown;
  requestId?: string;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 10_000;
const BODYLESS_METHODS = new Set(["GET", "HEAD"]);
const REFRESHABLE_AUTH_ERROR_CODES = new Set([
  "AUTH_REQUIRED",
  "INVALID_ACCESS_TOKEN",
]);
const SERVER_API_BASE_URL_FALLBACK = "http://localhost:8000";

let refreshAccessTokenPromise: Promise<boolean> | null = null;

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
  const {
    baseUrl = getDefaultApiBaseUrl(),
    body,
    headers: requestHeaders,
    requestId: requestedRequestId,
    signal,
    timeoutMs,
    ...fetchOptions
  } = options;
  const requestId = requestedRequestId ?? createRequestId();
  const headers = new Headers(requestHeaders);
  headers.set(REQUEST_ID_HEADER, requestId);
  const abortController = new AbortController();
  let didTimeout = false;
  const timeout = setTimeout(
    () => {
      didTimeout = true;
      abortController.abort();
    },
    timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  const hasBody = body !== undefined;
  const serializedBody = hasBody ? serializeRequestBody(body, headers) : undefined;
  if (hasBody && isBodylessMethod(fetchOptions.method)) {
    clearTimeout(timeout);
    throw new ApiError({
      type: "invalid_request_body",
      title: "Invalid Request Body",
      status: 0,
      detail: "GET 또는 HEAD 요청에는 body를 포함할 수 없습니다.",
      instance: path,
      code: "INVALID_REQUEST_BODY",
      request_id: requestId,
      errors: [],
    });
  }

  if (hasBody && !isNativeRequestBody(body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  logger.debug("api_request_started", {
    request_id: requestId,
    path,
    method: fetchOptions.method ?? "GET",
  });

  let response = await fetchApiRequest({
    path,
    baseUrl,
    fetchOptions,
    headers,
    body: serializedBody,
    signal: signal ?? abortController.signal,
    requestId,
    didTimeout: () => didTimeout,
  });

  if (!response.ok) {
    let problem = await readProblemDetails(response, path, requestId);
    if (shouldRefreshAndRetry(path, problem)) {
      const refreshed = await refreshAccessTokenOnce();
      if (refreshed) {
        response = await fetchApiRequest({
          path,
          baseUrl,
          fetchOptions,
          headers,
          body: serializedBody,
          signal: signal ?? abortController.signal,
          requestId,
          didTimeout: () => didTimeout,
        });
        if (response.ok) {
          clearTimeout(timeout);
          return readSuccessfulResponse<T>(response, {
            requestId,
            path,
            method: fetchOptions.method ?? "GET",
          });
        }
        problem = await readProblemDetails(response, path, requestId);
      }
    }

    logger.warn("api_request_failed", {
      request_id: problem.request_id,
      path,
      method: fetchOptions.method ?? "GET",
      status_code: problem.status,
      error_code: problem.code,
    });

    clearTimeout(timeout);
    throw new ApiError(problem);
  }

  clearTimeout(timeout);
  return readSuccessfulResponse<T>(response, {
    requestId,
    path,
    method: fetchOptions.method ?? "GET",
  });
}

async function fetchApiRequest({
  path,
  baseUrl,
  fetchOptions,
  headers,
  body,
  signal,
  requestId,
  didTimeout,
}: {
  path: string;
  baseUrl: string;
  fetchOptions: Omit<RequestInit, "body" | "headers" | "signal">;
  headers: Headers;
  body: BodyInit | undefined;
  signal: AbortSignal;
  requestId: string;
  didTimeout: () => boolean;
}): Promise<Response> {
  try {
    return await fetch(buildRequestUrl(path, baseUrl), {
      ...fetchOptions,
      headers,
      credentials: fetchOptions.credentials ?? "same-origin",
      body,
      signal,
    });
  } catch (error) {
    throw normalizeNetworkError(error, path, requestId, didTimeout());
  }
}

async function readProblemDetails(
  response: Response,
  path: string,
  requestId: string,
): Promise<ProblemDetails> {
  const body = isJsonResponse(response) ? await response.json() : undefined;
  return isProblemDetails(body)
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
}

function shouldRefreshAndRetry(path: string, problem: ProblemDetails): boolean {
  return (
    typeof window !== "undefined" &&
    path.startsWith("/api/") &&
    !path.startsWith("/api/auth/") &&
    REFRESHABLE_AUTH_ERROR_CODES.has(problem.code)
  );
}

async function refreshAccessTokenOnce(): Promise<boolean> {
  refreshAccessTokenPromise ??= tryRefreshAccessToken()
    .catch(() => false)
    .finally(() => {
      refreshAccessTokenPromise = null;
    });

  return refreshAccessTokenPromise;
}

async function tryRefreshAccessToken(): Promise<boolean> {
  const primaryResponse = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });
  if (primaryResponse.ok) {
    return true;
  }

  const legacyResponse = await fetch("/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });
  return legacyResponse.ok;
}

async function readSuccessfulResponse<T>(
  response: Response,
  context: {
    requestId: string;
    path: string;
    method: string;
  },
): Promise<T> {
  logger.debug("api_request_succeeded", {
    request_id: response.headers.get(REQUEST_ID_HEADER) ?? context.requestId,
    path: context.path,
    method: context.method,
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

function buildRequestUrl(path: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!baseUrl) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function getDefaultApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // 브라우저 요청은 HttpOnly 쿠키를 처리하는 Next.js Route Handler를 항상 경유한다.
    return "";
  }

  return (process.env.SERVER_API_BASE_URL ?? SERVER_API_BASE_URL_FALLBACK).replace(
    /\/$/,
    "",
  );
}

function serializeRequestBody(body: unknown, headers: Headers): BodyInit {
  if (isNativeRequestBody(body)) {
    if (body instanceof FormData) {
      headers.delete("Content-Type");
    }
    return body;
  }

  return JSON.stringify(body);
}

function isNativeRequestBody(body: unknown): body is BodyInit {
  return (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  );
}

function isBodylessMethod(method: string | undefined): boolean {
  return BODYLESS_METHODS.has((method ?? "GET").toUpperCase());
}

function normalizeNetworkError(
  error: unknown,
  path: string,
  requestId: string,
  didTimeout: boolean,
): ApiError {
  const isTimeout =
    didTimeout ||
    (error instanceof DOMException && error.name === "AbortError");
  const problem: ProblemDetails = {
    type: isTimeout ? "request_timeout" : "network_error",
    title: isTimeout ? "Request Timeout" : "Network Error",
    status: 0,
    detail: isTimeout
      ? "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."
      : "네트워크 요청을 완료하지 못했습니다.",
    instance: path,
    code: isTimeout ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
    request_id: requestId,
    errors: [],
  };

  logger.warn("api_request_network_failed", {
    request_id: requestId,
    path,
    error_code: problem.code,
  });

  return new ApiError(problem);
}

// --- 응답 타입 ---

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
  artist?: string | null;
  provider?: string;
  provider_track_id?: string | null;
  external_url?: string | null;
}

export interface MusicListResponse {
  default_tracks: MusicTrack[];
  ai_recommended: MusicTrack[];
}

export interface MusicRecommendPayload {
  message: string;
  mood?: string;
  scene?: string;
  story_hint?: string;
  avoid?: string;
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
  story_brief?: Record<string, unknown> | null;
  scene_plan?: Record<string, unknown>[];
  generation_prompt?: string | null;
  is_finalized: boolean;
}

// --- 기능별 API ---

export const api = {
  themes: {
    list: () => apiClient<Theme[]>("/api/v1/themes"),
  },

  music: {
    listByTheme: (themeId: number) =>
      apiClient<MusicListResponse>(`/api/v1/music?theme_id=${themeId}`),
    recommend: (movieId: number, payload: MusicRecommendPayload) =>
      apiClient<{ ai_message: string; tracks: MusicTrack[] }>(
        "/api/v1/music/recommend",
        { method: "POST", body: { movie_id: movieId, ...payload } },
      ),
  },

  movies: {
    createDraft: (themeId: number) =>
      apiClient<{ movie_id: number; status: string }>("/api/movies/draft", {
        method: "POST",
        body: { theme_id: themeId },
      }),
    updateMusic: (movieId: number, musicId: number) =>
      apiClient(`/api/movies/${movieId}/music`, {
        method: "PUT",
        body: { music_id: musicId },
      }),
    uploadFile: async (movieId: number, file: File): Promise<FileInfo> => {
      const form = new FormData();
      form.append("file", file);
      return apiClient<FileInfo>(`/api/movies/${movieId}/files`, {
        method: "POST",
        body: form,
      });
    },
    chat: (movieId: number, message: string) =>
      apiClient<{ ai_question: string; current_draft: string }>(
        `/api/movies/${movieId}/chat`,
        { method: "POST", body: { message }, timeoutMs: 60_000 },
      ),
    getChatHistory: (movieId: number) =>
      apiClient<{ history: ChatMessage[] }>(`/api/movies/${movieId}/chat`),
    getSummary: (movieId: number) =>
      apiClient<SummaryResponse>(`/api/movies/${movieId}/summary`),
    finalizeStory: (movieId: number) =>
      apiClient<SummaryResponse>(`/api/movies/${movieId}/finalize-story`, {
        method: "POST",
        timeoutMs: 60_000,
      }),
    generate: (movieId: number) =>
      apiClient(`/api/movies/${movieId}/generate`, { method: "POST" }),
  },
};
