export type AuthMode = "login" | "signup";

export type AuthUser = {
  id: number;
  email: string;
  display_name: string | null;
  role: "USER" | "ADMIN";
  status: "PENDING" | "ACTIVE" | "DISABLED" | "DELETED";
  created_at: string;
  updated_at: string;
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
};

export type CurrentUserResponse = {
  user: AuthUser;
};

export type SignupPayload = {
  email: string;
  password: string;
  display_name?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};
