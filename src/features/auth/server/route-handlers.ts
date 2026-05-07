import { NextRequest, NextResponse } from "next/server";

import type {
  AuthSessionResponse,
  AuthTokenResponse,
  ProblemDetails,
} from "@/features/auth/server/types";
import { getOrCreateRequestId, REQUEST_ID_HEADER } from "@/lib/request-id";
import { logger } from "@/lib/logger";

const ACCESS_TOKEN_COOKIE_NAME = "my_life_movie.access_token";
const ACCESS_TOKEN_COOKIE_PATH = "/";
const SERVER_API_BASE_URL_FALLBACK = "http://localhost:8000";

const BACKEND_POST_PATHS = {
  login: "/auth/login",
  signup: "/auth/signup",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
} as const;

type BackendPostAction = keyof typeof BACKEND_POST_PATHS;

export async function handleAuthApiPost(
  request: NextRequest,
  action: string,
): Promise<NextResponse> {
  if (!isBackendPostAction(action)) {
    return problemResponse(
      "not_found",
      "Not Found",
      404,
      "지원하지 않는 인증 API입니다.",
      "AUTH_ROUTE_NOT_FOUND",
      request.nextUrl.pathname,
      getOrCreateRequestId(request.headers),
    );
  }

  const backendResponse = await safelyFetchBackendAuth(
    request,
    BACKEND_POST_PATHS[action],
  );
  if (backendResponse instanceof NextResponse) {
    return backendResponse;
  }
  if (!backendResponse.ok) {
    const response = await proxyBackendResponse(backendResponse, request);
    if (backendResponse.status === 401) {
      clearAccessTokenCookie(response);
    }
    return response;
  }

  if (action === "logout") {
    const response = await proxyBackendResponse(backendResponse, request);
    clearAccessTokenCookie(response);
    return response;
  }

  const backendBody = (await backendResponse.json()) as AuthTokenResponse;
  const response = NextResponse.json(toAuthSessionResponse(backendBody), {
    status: backendResponse.status,
  });
  forwardResponseMetadata(backendResponse, response, request);
  setAccessTokenCookie(response, backendBody);
  return response;
}

export async function handleAuthApiGet(
  request: NextRequest,
  action: string,
): Promise<NextResponse> {
  if (action !== "me") {
    return problemResponse(
      "not_found",
      "Not Found",
      404,
      "지원하지 않는 인증 API입니다.",
      "AUTH_ROUTE_NOT_FOUND",
      request.nextUrl.pathname,
      getOrCreateRequestId(request.headers),
    );
  }

  const requestId = getOrCreateRequestId(request.headers);
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  if (!accessToken) {
    return problemResponse(
      "auth_required",
      "Auth Required",
      401,
      "access token이 필요합니다.",
      "AUTH_REQUIRED",
      request.nextUrl.pathname,
      requestId,
    );
  }

  const backendResponse = await safelyFetchBackendAuth(request, "/auth/me", {
    Authorization: `Bearer ${accessToken}`,
  });
  if (backendResponse instanceof NextResponse) {
    return backendResponse;
  }
  const response = await proxyBackendResponse(backendResponse, request);
  if (backendResponse.status === 401) {
    clearAccessTokenCookie(response);
  }
  return response;
}

async function safelyFetchBackendAuth(
  request: NextRequest,
  backendPath: string,
  extraHeaders: Record<string, string> = {},
): Promise<Response | NextResponse> {
  const requestId = getOrCreateRequestId(request.headers);
  try {
    return await fetchBackendAuth(request, backendPath, extraHeaders);
  } catch (error) {
    logger.warn("auth_backend_request_failed", {
      request_id: requestId,
      path: backendPath,
      error_name: error instanceof Error ? error.name : "UnknownError",
    });

    return problemResponse(
      "backend_unavailable",
      "Backend Unavailable",
      502,
      "인증 서버와 통신하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "BACKEND_UNAVAILABLE",
      request.nextUrl.pathname,
      requestId,
    );
  }
}

async function fetchBackendAuth(
  request: NextRequest,
  backendPath: string,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  const requestId = getOrCreateRequestId(request.headers);
  const headers = new Headers(extraHeaders);
  headers.set(REQUEST_ID_HEADER, requestId);
  headers.set("Accept", "application/json");

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headers.set("User-Agent", userAgent);
  }

  const cookie = request.headers.get("cookie");
  if (cookie) {
    headers.set("Cookie", cookie);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.text() : undefined;

  logger.debug("auth_backend_request_started", {
    request_id: requestId,
    path: backendPath,
    method: request.method,
  });

  return fetch(`${getServerApiBaseUrl()}${backendPath}`, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });
}

async function proxyBackendResponse(
  backendResponse: Response,
  request: NextRequest,
): Promise<NextResponse> {
  const responseBody = await readBackendResponseBody(backendResponse);
  const response = NextResponse.json(responseBody, {
    status: backendResponse.status,
  });
  forwardResponseMetadata(backendResponse, response, request);
  return response;
}

async function readBackendResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return {
    detail: await response.text(),
  };
}

function forwardResponseMetadata(
  backendResponse: Response,
  response: NextResponse,
  request: NextRequest,
) {
  response.headers.set(
    REQUEST_ID_HEADER,
    backendResponse.headers.get(REQUEST_ID_HEADER) ??
      getOrCreateRequestId(request.headers),
  );

  for (const cookie of getSetCookieHeaders(backendResponse.headers)) {
    response.headers.append("Set-Cookie", cookie);
  }
}

function getSetCookieHeaders(headers: Headers): string[] {
  const headersWithSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };
  const cookies = headersWithSetCookie.getSetCookie?.();
  if (cookies?.length) {
    return cookies;
  }

  const cookie = headers.get("set-cookie");
  return cookie ? [cookie] : [];
}

function setAccessTokenCookie(
  response: NextResponse,
  backendBody: AuthTokenResponse,
) {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: backendBody.access_token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: ACCESS_TOKEN_COOKIE_PATH,
    maxAge: backendBody.expires_in,
  });
}

function clearAccessTokenCookie(response: NextResponse) {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: ACCESS_TOKEN_COOKIE_PATH,
    maxAge: 0,
  });
}

function toAuthSessionResponse(
  backendBody: AuthTokenResponse,
): AuthSessionResponse {
  return {
    token_type: backendBody.token_type,
    expires_in: backendBody.expires_in,
    user: backendBody.user,
  };
}

function problemResponse(
  type: string,
  title: string,
  status: number,
  detail: string,
  code: string,
  instance: string,
  requestId: string,
): NextResponse<ProblemDetails> {
  return NextResponse.json(
    {
      type,
      title,
      status,
      detail,
      instance,
      code,
      request_id: requestId,
      errors: [],
    },
    {
      status,
      headers: {
        [REQUEST_ID_HEADER]: requestId,
      },
    },
  );
}

function isBackendPostAction(action: string): action is BackendPostAction {
  return action in BACKEND_POST_PATHS;
}

function getServerApiBaseUrl(): string {
  return (
    process.env.SERVER_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    SERVER_API_BASE_URL_FALLBACK
  ).replace(/\/$/, "");
}
