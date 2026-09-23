const VERSIONED_API_PATH = "/api/v1/";

export function getApiBaseUrl(
  configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL,
): URL {
  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required.");
  }

  const url = new URL(configuredUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTP or HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL must not contain credentials, a query or a fragment.",
    );
  }
  if (configuredUrl.includes("\\")) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must not contain backslashes.");
  }

  const normalizedPath = url.pathname.endsWith("/")
    ? url.pathname
    : url.pathname + "/";
  if (!normalizedPath.endsWith(VERSIONED_API_PATH)) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must end with /api/v1/.");
  }

  url.pathname = normalizedPath;
  return url;
}

export function buildApiUrl(path: string, configuredUrl?: string): string {
  if (
    path.trim() !== path ||
    /^[a-z][a-z\d+.-]*:/i.test(path) ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("#")
  ) {
    throw new Error("API paths must be relative.");
  }

  const normalizedPath = path.replace(/^\/+/, "");
  const pathname = normalizedPath.split("?", 1)[0];
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    throw new Error("API paths must use valid URL encoding.");
  }
  if (
    /%2f|%5c/i.test(pathname) ||
    decodedPath.split("/").some((part) => part === "." || part === "..")
  ) {
    throw new Error("API paths must stay within the configured API boundary.");
  }

  const baseUrl = getApiBaseUrl(configuredUrl);
  const url = new URL(normalizedPath, baseUrl);
  if (
    url.origin !== baseUrl.origin ||
    !url.pathname.startsWith(baseUrl.pathname)
  ) {
    throw new Error("API paths must stay within the configured API boundary.");
  }
  return url.toString();
}

export type ApiErrorKind =
  "http" | "network" | "invalid_response" | "cancelled";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly status: number | null = null,
    readonly details: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function errorDetails(payload: unknown): unknown {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "details" in payload.error
  ) {
    return payload.error.details;
  }
  return null;
}

/**
 * Request JSON without retries or redirects. The HTTP response owns its status;
 * backend validation details remain structured for deliberate presentation.
 * The caller validates the response shape before relying on business values.
 */
export async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  configuredUrl?: string,
): Promise<T | undefined> {
  const url = buildApiUrl(path, configuredUrl);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      credentials: "omit",
      ...options,
      headers,
      redirect: "error",
    });
  } catch {
    if (options.signal?.aborted) {
      throw new ApiError("The request was cancelled.", "cancelled");
    }
    throw new ApiError(
      "Unable to reach the service. Please try again.",
      "network",
    );
  }

  if (
    response.ok &&
    (response.status === 204 || options.method?.toUpperCase() === "HEAD")
  ) {
    return undefined;
  }

  let payload: unknown;
  try {
    const mediaType = response.headers
      .get("Content-Type")
      ?.split(";", 1)[0]
      .trim()
      .toLowerCase();
    if (mediaType !== "application/json" && !mediaType?.endsWith("+json")) {
      throw new Error("Expected a JSON response.");
    }
    payload = await response.json();
  } catch {
    if (options.signal?.aborted) {
      throw new ApiError("The request was cancelled.", "cancelled");
    }
    if (!response.ok) {
      throw new ApiError(
        "The service could not complete the request.",
        "http",
        response.status,
      );
    }
    throw new ApiError(
      "The service returned an unexpected response.",
      "invalid_response",
      response.status,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      "The service could not complete the request.",
      "http",
      response.status,
      errorDetails(payload),
    );
  }
  return payload as T;
}
