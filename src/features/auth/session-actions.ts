import { ApiError } from "@/lib/api";
import {
  getCurrentUser,
  logout,
  refreshAccessToken,
} from "@/features/auth/api";
import {
  clearAuthSession,
  saveAuthSession,
} from "@/features/auth/session";
import type { AuthUser } from "@/features/auth/types";

const REFRESHABLE_AUTH_ERROR_CODES = new Set([
  "AUTH_REQUIRED",
  "INVALID_ACCESS_TOKEN",
]);

let refreshSessionPromise: Promise<AuthUser> | null = null;

export async function refreshAuthSession(): Promise<AuthUser> {
  refreshSessionPromise ??= refreshAccessToken()
    .then((response) => {
      saveAuthSession(response);
      return response.user;
    })
    .finally(() => {
      refreshSessionPromise = null;
    });

  return refreshSessionPromise;
}

export async function loadCurrentUser(): Promise<AuthUser> {
  try {
    const response = await getCurrentUser();
    return response.user;
  } catch (error) {
    if (isRefreshableAuthError(error)) {
      clearAuthSession();
      return refreshAuthSession();
    }

    throw error;
  }
}

export async function logoutCurrentUser(): Promise<void> {
  try {
    await logout();
  } finally {
    clearAuthSession();
  }
}

function isRefreshableAuthError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    REFRESHABLE_AUTH_ERROR_CODES.has(error.problem.code)
  );
}
