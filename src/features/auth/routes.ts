import type { AuthMode } from "@/features/auth/types";
import { APP_ROUTES, getSafeInternalPath } from "@/lib/routes";

const DEFAULT_AUTH_SUCCESS_PATHS = {
  login: APP_ROUTES.movies,
  signup: APP_ROUTES.createMovie,
} satisfies Record<AuthMode, string>;

export function getAuthSuccessPath(
  mode: AuthMode,
  requestedNextPath: string | null,
): string {
  return getSafeInternalPath(requestedNextPath) ?? DEFAULT_AUTH_SUCCESS_PATHS[mode];
}

export function normalizeNextPath(
  nextPath: string | string[] | undefined,
): string | null {
  if (Array.isArray(nextPath)) {
    return nextPath[0] ?? null;
  }

  return nextPath ?? null;
}
