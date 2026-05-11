import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SidebarNav from "@/components/sidebar-nav";

let pathname = "/movies";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

describe("SidebarNav", () => {
  beforeEach(() => {
    pathname = "/movies";
  });

  it("프로필 메뉴를 /profile 라우트로 연결한다", () => {
    render(<SidebarNav />);

    expect(screen.getByRole("link", { name: "프로필" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("영화 생성 메뉴를 실제 생성 시작 라우트로 연결한다", () => {
    render(<SidebarNav />);

    expect(screen.getByRole("link", { name: "영화 생성" })).toHaveAttribute(
      "href",
      "/create",
    );
  });

  it("현재 프로필 경로를 활성 메뉴로 표시한다", () => {
    pathname = "/profile";

    render(<SidebarNav />);

    expect(screen.getByRole("link", { name: "프로필" })).toHaveClass(
      "text-amber-400",
    );
  });
});
