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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

const DEFAULT_TIMEOUT_MS = 10_000;

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
    baseUrl = API_BASE_URL,
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
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  logger.debug("api_request_started", {
    request_id: requestId,
    path,
    method: fetchOptions.method ?? "GET",
  });

  let response: Response;
  try {
    response = await fetch(buildRequestUrl(path, baseUrl), {
      ...fetchOptions,
      headers,
      credentials: fetchOptions.credentials ?? "same-origin",
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: signal ?? abortController.signal,
    });
  } catch (error) {
    throw normalizeNetworkError(error, path, requestId, didTimeout);
  } finally {
    clearTimeout(timeout);
  }

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
      method: fetchOptions.method ?? "GET",
      status_code: problem.status,
      error_code: problem.code,
    });

    throw new ApiError(problem);
  }

  logger.debug("api_request_succeeded", {
    request_id: response.headers.get(REQUEST_ID_HEADER) ?? requestId,
    path,
    method: fetchOptions.method ?? "GET",
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
