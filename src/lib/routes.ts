export const APP_ROUTES = {
  home: "/",
  createMovie: "/create",
  movies: "/movies",
  auth: {
    login: "/auth/login",
    signup: "/auth/signup",
  },
} as const;

const UNSAFE_REDIRECT_PREFIXES = ["//", "/\\"];

// 외부 URL이나 프로토콜 기반 URL로 튀는 open redirect를 막기 위한 내부 경로 검증이다.
export function getSafeInternalPath(
  value: string | null | undefined,
): string | null {
  if (!value?.startsWith("/")) {
    return null;
  }

  if (UNSAFE_REDIRECT_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    return null;
  }

  try {
    const parsedUrl = new URL(value, "http://localhost");
    if (parsedUrl.origin !== "http://localhost") {
      return null;
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return null;
  }
}
