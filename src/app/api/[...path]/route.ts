import { NextRequest } from "next/server";

import { handleBackendApiRequest } from "@/features/backend/server/route-handlers";

export const dynamic = "force-dynamic";

type BackendApiRouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(
  request: NextRequest,
  context: BackendApiRouteContext,
) {
  return handleBackendApiRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: BackendApiRouteContext,
) {
  return handleBackendApiRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: BackendApiRouteContext,
) {
  return handleBackendApiRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: BackendApiRouteContext,
) {
  return handleBackendApiRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: BackendApiRouteContext,
) {
  return handleBackendApiRequest(request, context);
}
