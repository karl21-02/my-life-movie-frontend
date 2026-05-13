import { NextRequest, NextResponse } from "next/server";

const SERVER_API_BASE_URL_FALLBACK = "http://localhost:8000";

type GeneratedAssetRouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: GeneratedAssetRouteContext,
) {
  const { path } = await context.params;
  const backendPath = `/generated/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const backendResponse = await fetch(`${getServerApiBaseUrl()}${backendPath}`, {
    method: "GET",
    cache: "no-store",
  });

  const body = backendResponse.status === 304 ? null : await backendResponse.arrayBuffer();
  const response = new NextResponse(body, {
    status: backendResponse.status,
  });

  for (const headerName of ["content-type", "content-length", "cache-control"]) {
    const headerValue = backendResponse.headers.get(headerName);
    if (headerValue) {
      response.headers.set(headerName, headerValue);
    }
  }

  return response;
}

function getServerApiBaseUrl(): string {
  return (process.env.SERVER_API_BASE_URL ?? SERVER_API_BASE_URL_FALLBACK).replace(
    /\/$/,
    "",
  );
}
