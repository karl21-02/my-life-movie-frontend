import { apiClient } from "@/lib/api";
import type {
  AuthTokenResponse,
  CurrentUserResponse,
  LoginPayload,
  LogoutResponse,
  SignupPayload,
} from "@/features/auth/types";

export function signup(payload: SignupPayload) {
  return apiClient<AuthTokenResponse>("/auth/signup", {
    method: "POST",
    body: payload,
  });
}

export function login(payload: LoginPayload) {
  return apiClient<AuthTokenResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function refreshAccessToken() {
  return apiClient<AuthTokenResponse>("/auth/refresh", {
    method: "POST",
  });
}

export function logout() {
  return apiClient<LogoutResponse>("/auth/logout", {
    method: "POST",
  });
}

export function getCurrentUser(accessToken: string) {
  return apiClient<CurrentUserResponse>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
