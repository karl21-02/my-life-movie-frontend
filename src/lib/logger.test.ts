import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("민감한 값을 로그 context에서 마스킹한다", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    logger.warn("auth_failed", {
      request_id: "req_test",
      password: "plain-password",
      token: "secret-token",
      access_token: "access-token",
      refreshToken: "refresh-token",
      nested: {
        apiKey: "api-key",
      },
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatchObject({
      event: "auth_failed",
      request_id: "req_test",
      password: "[REDACTED]",
      token: "[REDACTED]",
      access_token: "[REDACTED]",
      refreshToken: "[REDACTED]",
      nested: {
        apiKey: "[REDACTED]",
      },
    });
  });
});
