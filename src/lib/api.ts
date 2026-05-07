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
    credentials: options.credentials ?? "include",
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
