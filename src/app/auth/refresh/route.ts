import { NextRequest } from "next/server";

import { handleAuthApiPost } from "@/features/auth/server/route-handlers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleAuthApiPost(request, "refresh");
}
