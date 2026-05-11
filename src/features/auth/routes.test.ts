import { describe, expect, it } from "vitest";

import { getAuthSuccessPath, normalizeNextPath } from "@/features/auth/routes";

describe("auth routes", () => {
  it("회원가입 기본 성공 경로는 영화 생성 화면이다", () => {
    expect(getAuthSuccessPath("signup", null)).toBe("/create");
  });

  it("로그인 기본 성공 경로는 영화 목록 화면이다", () => {
    expect(getAuthSuccessPath("login", null)).toBe("/movies");
  });

  it("안전한 next 경로가 있으면 우선 사용한다", () => {
    expect(getAuthSuccessPath("login", "/create?theme_id=1")).toBe(
      "/create?theme_id=1",
    );
  });

  it("Next.js searchParams의 배열 값을 첫 번째 경로로 정규화한다", () => {
    expect(normalizeNextPath(["/movies", "/create"])).toBe("/movies");
  });
});
