import type { AuthSessionResponse, AuthUser } from "@/features/auth/types";

const AUTH_USER_STORAGE_KEY = "my_life_movie.auth_user";
const AUTH_EXPIRES_AT_STORAGE_KEY = "my_life_movie.auth_expires_at";

let memoryAuthUser: AuthUser | null = null;
let memoryAuthExpiresAt: number | null = null;

export type AuthSessionSnapshot = {
  user: AuthUser;
  expiresAt: number;
};

export function saveAuthSession(response: AuthSessionResponse): AuthSessionSnapshot {
  const expiresAt = Date.now() + response.expires_in * 1000;
  memoryAuthUser = response.user;
  memoryAuthExpiresAt = expiresAt;

  if (canUseSessionStorage()) {
    window.sessionStorage.setItem(
      AUTH_USER_STORAGE_KEY,
      JSON.stringify(response.user),
    );
    window.sessionStorage.setItem(
      AUTH_EXPIRES_AT_STORAGE_KEY,
      String(expiresAt),
    );
  }

  return {
    user: response.user,
    expiresAt,
  };
}

export function getAuthSession(): AuthSessionSnapshot | null {
  const user = memoryAuthUser ?? readStoredAuthUser();
  const expiresAt = memoryAuthExpiresAt ?? Number(
    readSessionStorage(AUTH_EXPIRES_AT_STORAGE_KEY),
  );

  if (!user || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    clearAuthSession();
    return null;
  }

  memoryAuthUser = user;
  memoryAuthExpiresAt = expiresAt;
  return {
    user,
    expiresAt,
  };
}

export function clearAuthSession() {
  memoryAuthUser = null;
  memoryAuthExpiresAt = null;

  if (canUseSessionStorage()) {
    window.sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_EXPIRES_AT_STORAGE_KEY);
  }
}

function readStoredAuthUser(): AuthUser | null {
  const storedUser = readSessionStorage(AUTH_USER_STORAGE_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

function readSessionStorage(key: string): string | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  return window.sessionStorage.getItem(key);
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && "sessionStorage" in window;
}
