import type { AuthTokenResponse } from "@/features/auth/types";

const ACCESS_TOKEN_STORAGE_KEY = "my_life_movie.access_token";
const ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY = "my_life_movie.access_token_expires_at";

let memoryAccessToken: string | null = null;
let memoryAccessTokenExpiresAt: number | null = null;

export type AuthSessionSnapshot = {
  accessToken: string;
  expiresAt: number;
};

export function saveAuthSession(response: AuthTokenResponse): AuthSessionSnapshot {
  const expiresAt = Date.now() + response.expires_in * 1000;
  memoryAccessToken = response.access_token;
  memoryAccessTokenExpiresAt = expiresAt;

  if (canUseSessionStorage()) {
    window.sessionStorage.setItem(
      ACCESS_TOKEN_STORAGE_KEY,
      response.access_token,
    );
    window.sessionStorage.setItem(
      ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY,
      String(expiresAt),
    );
  }

  return {
    accessToken: response.access_token,
    expiresAt,
  };
}

export function getAuthSession(): AuthSessionSnapshot | null {
  const accessToken = memoryAccessToken ?? readSessionStorage(ACCESS_TOKEN_STORAGE_KEY);
  const expiresAt = memoryAccessTokenExpiresAt ?? Number(
    readSessionStorage(ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY),
  );

  if (!accessToken || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    clearAuthSession();
    return null;
  }

  memoryAccessToken = accessToken;
  memoryAccessTokenExpiresAt = expiresAt;
  return {
    accessToken,
    expiresAt,
  };
}

export function getAccessToken(): string | null {
  return getAuthSession()?.accessToken ?? null;
}

export function clearAuthSession() {
  memoryAccessToken = null;
  memoryAccessTokenExpiresAt = null;

  if (canUseSessionStorage()) {
    window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    window.sessionStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY);
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
