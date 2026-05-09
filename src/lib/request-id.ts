export const REQUEST_ID_HEADER = "X-Request-ID";

export function createRequestId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return `req_${globalThis.crypto.randomUUID().replaceAll("-", "")}`;
  }

  return `req_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function getOrCreateRequestId(headers: Headers): string {
  return headers.get(REQUEST_ID_HEADER) ?? createRequestId();
}
