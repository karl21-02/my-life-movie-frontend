import { NextRequest } from "next/server";

import {
  handleAuthApiGet,
  handleAuthApiPost,
} from "@/features/auth/server/route-handlers";

export const dynamic = "force-dynamic";

type AuthApiRouteContext = {
  params: Promise<{
    action: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: AuthApiRouteContext,
) {
  const { action } = await context.params;
  return handleAuthApiGet(request, action);
}

export async function POST(
  request: NextRequest,
  context: AuthApiRouteContext,
) {
  const { action } = await context.params;
  return handleAuthApiPost(request, action);
}
