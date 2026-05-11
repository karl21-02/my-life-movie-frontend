import { describe, expect, it } from "vitest";

import { getSafeInternalPath } from "@/lib/routes";

describe("routes", () => {
  it("내부 경로와 query string을 유지한다", () => {
    expect(getSafeInternalPath("/create?theme_id=1")).toBe("/create?theme_id=1");
  });

  it("외부 URL과 protocol-relative URL은 거부한다", () => {
    expect(getSafeInternalPath("https://example.com/create")).toBeNull();
    expect(getSafeInternalPath("//example.com/create")).toBeNull();
  });

  it("경로가 아니면 거부한다", () => {
    expect(getSafeInternalPath("create")).toBeNull();
    expect(getSafeInternalPath(null)).toBeNull();
  });
});
