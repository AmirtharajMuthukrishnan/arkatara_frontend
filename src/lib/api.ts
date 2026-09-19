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
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith("//")) {
    throw new Error("API paths must be relative.");
  }

  const normalizedPath = path.replace(/^\/+/, "");
  return new URL(normalizedPath, getApiBaseUrl(configuredUrl)).toString();
}
