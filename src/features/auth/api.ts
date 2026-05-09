import { apiClient } from "@/lib/api";
import type {
  AuthSessionResponse,
  CurrentUserResponse,
  LoginPayload,
  LogoutResponse,
  SignupPayload,
} from "@/features/auth/types";

const AUTH_API_BASE_PATH = "/auth/api";

export function signup(payload: SignupPayload) {
  return apiClient<AuthSessionResponse>(`${AUTH_API_BASE_PATH}/signup`, {
    method: "POST",
    body: payload,
  });
}

export function login(payload: LoginPayload) {
  return apiClient<AuthSessionResponse>(`${AUTH_API_BASE_PATH}/login`, {
    method: "POST",
    body: payload,
  });
}

export function refreshAccessToken() {
  return apiClient<AuthSessionResponse>(`${AUTH_API_BASE_PATH}/refresh`, {
    method: "POST",
  });
}

export function logout() {
  return apiClient<LogoutResponse>(`${AUTH_API_BASE_PATH}/logout`, {
    method: "POST",
  });
}

export function getCurrentUser() {
  return apiClient<CurrentUserResponse>(`${AUTH_API_BASE_PATH}/me`, {
    method: "GET",
  });
}
