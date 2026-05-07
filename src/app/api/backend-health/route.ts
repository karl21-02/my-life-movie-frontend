import { NextResponse } from "next/server";

const SERVER_API_BASE_URL =
  process.env.SERVER_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000";

export async function GET() {
  const response = await fetch(`${SERVER_API_BASE_URL.replace(/\/$/, "")}/health`, {
    cache: "no-store",
  });

  const body = await response.json();

  return NextResponse.json(
    {
      backend: body,
      status: response.status,
    },
    { status: response.ok ? 200 : 502 },
  );
}
