import { apiClient } from "@/lib/api";
import type {
  AuthTokenResponse,
  CurrentUserResponse,
  LoginPayload,
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

export function getCurrentUser() {
  return apiClient<CurrentUserResponse>("/auth/me", {
    method: "GET",
  });
}
