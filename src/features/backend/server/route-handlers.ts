import { NextRequest, NextResponse } from "next/server";

import type { ProblemDetails } from "@/lib/api";
import { logger } from "@/lib/logger";
import { getOrCreateRequestId, REQUEST_ID_HEADER } from "@/lib/request-id";

const ACCESS_TOKEN_COOKIE_NAME = "my_life_movie.access_token";
const SERVER_API_BASE_URL_FALLBACK = "http://localhost:8000";

type BackendRouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const RESPONSE_HEADERS_TO_FORWARD = new Set([
  "content-type",
  "set-cookie",
  REQUEST_ID_HEADER.toLowerCase(),
]);

export async function handleBackendApiRequest(
  request: NextRequest,
  context: BackendRouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  const requestId = getOrCreateRequestId(request.headers);
  const backendPath = `/api/${path.join("/")}${request.nextUrl.search}`;

  try {
    const backendResponse = await fetchBackendApi(request, backendPath, requestId);
    return await createProxyResponse(backendResponse, requestId);
  } catch (error) {
    logger.warn("backend_api_proxy_failed", {
      request_id: requestId,
      path: backendPath,
      method: request.method,
      error_name: error instanceof Error ? error.name : "UnknownError",
    });

    return problemResponse(
      "backend_unavailable",
      "Backend Unavailable",
      502,
      "백엔드 API와 통신하지 못했습니다. 잠시 후 다시 시도해주세요.",
      "BACKEND_UNAVAILABLE",
      request.nextUrl.pathname,
      requestId,
    );
  }
}

async function fetchBackendApi(
  request: NextRequest,
  backendPath: string,
  requestId: string,
): Promise<Response> {
  const headers = createBackendHeaders(request, requestId);
  const body = await readRequestBody(request);

  logger.debug("backend_api_proxy_started", {
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

function createBackendHeaders(request: NextRequest, requestId: string): Headers {
  const headers = new Headers();

  for (const [name, value] of request.headers.entries()) {
    if (!HOP_BY_HOP_REQUEST_HEADERS.has(name.toLowerCase())) {
      headers.set(name, value);
    }
  }

  headers.set(REQUEST_ID_HEADER, requestId);

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

async function readRequestBody(request: NextRequest): Promise<ArrayBuffer | undefined> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const body = await request.arrayBuffer();
  return body.byteLength > 0 ? body : undefined;
}

async function createProxyResponse(
  backendResponse: Response,
  requestId: string,
): Promise<NextResponse> {
  const responseBody =
    backendResponse.status === 204 || backendResponse.status === 304
      ? null
      : await backendResponse.arrayBuffer();
  const response = new NextResponse(responseBody, {
    status: backendResponse.status,
  });

  for (const [name, value] of backendResponse.headers.entries()) {
    if (RESPONSE_HEADERS_TO_FORWARD.has(name.toLowerCase())) {
      response.headers.set(name, value);
    }
  }

  if (!response.headers.has(REQUEST_ID_HEADER)) {
    response.headers.set(REQUEST_ID_HEADER, requestId);
  }

  return response;
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

function getServerApiBaseUrl(): string {
  return (process.env.SERVER_API_BASE_URL ?? SERVER_API_BASE_URL_FALLBACK).replace(
    /\/$/,
    "",
  );
}
