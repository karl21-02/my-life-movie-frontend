import { apiClient } from "@/lib/api";
import type {
  AuthSessionResponse,
  CurrentUserResponse,
  LoginPayload,
  LogoutResponse,
  SignupPayload,
} from "@/features/auth/types";

const AUTH_API_BASE_PATH = "/auth/api";
const AUTH_API_CLIENT_OPTIONS = {
  baseUrl: "",
} as const;

export function signup(payload: SignupPayload) {
  return apiClient<AuthSessionResponse>(`${AUTH_API_BASE_PATH}/signup`, {
    ...AUTH_API_CLIENT_OPTIONS,
    method: "POST",
    body: payload,
  });
}

export function login(payload: LoginPayload) {
  return apiClient<AuthSessionResponse>(`${AUTH_API_BASE_PATH}/login`, {
    ...AUTH_API_CLIENT_OPTIONS,
    method: "POST",
    body: payload,
  });
}

export function refreshAccessToken() {
  return apiClient<AuthSessionResponse>(`${AUTH_API_BASE_PATH}/refresh`, {
    ...AUTH_API_CLIENT_OPTIONS,
    method: "POST",
  });
}

export function logout() {
  return apiClient<LogoutResponse>(`${AUTH_API_BASE_PATH}/logout`, {
    ...AUTH_API_CLIENT_OPTIONS,
    method: "POST",
  });
}

export function getCurrentUser() {
  return apiClient<CurrentUserResponse>(`${AUTH_API_BASE_PATH}/me`, {
    ...AUTH_API_CLIENT_OPTIONS,
    method: "GET",
  });
}
