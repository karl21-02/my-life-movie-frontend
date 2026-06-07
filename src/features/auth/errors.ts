import { ApiError } from "@/lib/api";

const UNAUTHENTICATED_ERROR_CODES = new Set([
  "AUTH_REQUIRED",
  "INVALID_ACCESS_TOKEN",
  "INVALID_REFRESH_TOKEN",
  "REFRESH_TOKEN_REUSED",
]);

export function isUnauthenticatedError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.problem.status === 401 ||
      UNAUTHENTICATED_ERROR_CODES.has(error.problem.code))
  );
}
