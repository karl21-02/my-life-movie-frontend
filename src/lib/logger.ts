type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "token",
  "access_token",
  "accesstoken",
  "refresh_token",
  "refreshtoken",
  "password",
  "api_key",
  "apikey",
  "secret",
  "payload",
  "prompt",
  "filecontent",
  "content",
]);

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minimumLevel: LogLevel =
  process.env.NODE_ENV === "production" ? "warn" : "debug";

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        isSensitiveKey(key) ? "[REDACTED]" : redact(item),
      ]),
    );
  }

  return value;
}

function isSensitiveKey(key: string): boolean {
  const normalizedKey = key.toLowerCase().replaceAll(/[-_\s]/g, "");
  return (
    SENSITIVE_KEYS.has(key.toLowerCase()) ||
    normalizedKey.includes("accesstoken") ||
    normalizedKey.includes("refreshtoken") ||
    normalizedKey.includes("authorization") ||
    normalizedKey.includes("password") ||
    normalizedKey.includes("apikey") ||
    normalizedKey.includes("secret") ||
    normalizedKey === "cookie"
  );
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minimumLevel];
}

function writeLog(level: LogLevel, event: string, context: LogContext = {}) {
  if (!shouldLog(level)) {
    return;
  }

  const safeContext = redact(context) as LogContext;
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: "my-life-movie-frontend",
    environment: process.env.NODE_ENV ?? "development",
    event,
    ...safeContext,
  };

  if (level === "debug") {
    console.debug(payload);
    return;
  }
  if (level === "info") {
    console.info(payload);
    return;
  }
  if (level === "warn") {
    console.warn(payload);
    return;
  }
  console.error(payload);
}

export const logger = {
  debug: (event: string, context?: LogContext) =>
    writeLog("debug", event, context),
  info: (event: string, context?: LogContext) =>
    writeLog("info", event, context),
  warn: (event: string, context?: LogContext) =>
    writeLog("warn", event, context),
  error: (event: string, context?: LogContext) =>
    writeLog("error", event, context),
};
