import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, buildApiUrl, getApiBaseUrl, requestJson } from "./api";

const API_BASE = "https://api.example.com/api/v1/";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("versioned API configuration", () => {
  it("builds requests under the v1 API boundary", () => {
    expect(buildApiUrl("/health/", "http://localhost:8000/api/v1")).toBe(
      "http://localhost:8000/api/v1/health/",
    );
  });

  it("rejects an unversioned API base URL", () => {
    expect(() => getApiBaseUrl("http://localhost:8000/")).toThrow(
      "must end with /api/v1/",
    );
  });

  it("rejects absolute request paths", () => {
    expect(() =>
      buildApiUrl("https://example.com", "http://localhost:8000/api/v1/"),
    ).toThrow("API paths must be relative");
  });

  it.each([
    "../admin/",
    "../../admin/",
    "%2e%2e/admin/",
    ".%2e/admin/",
    "health/../../admin/",
    "%2f%2fevil.example/path",
    "\\\\evil.example/path",
    "//evil.example/path",
    " https://evil.example/path",
    "health/#ignored",
    "health/%invalid",
  ])("rejects ambiguous or escaping request paths: %s", (path) => {
    expect(() => buildApiUrl(path, API_BASE)).toThrow();
  });

  it.each([
    "https://user:secret@api.example.com/api/v1/",
    "https://api.example.com/api/v1/?secret=value",
    "https://api.example.com/api/v1/#fragment",
    "https://api.example.com\\api\\v1\\",
    "file:///api/v1/",
  ])("rejects unsafe API base configuration: %s", (base) => {
    expect(() => getApiBaseUrl(base)).toThrow();
  });

  it("preserves a configured path prefix and an endpoint query", () => {
    expect(
      buildApiUrl(
        "health/?verbose=true",
        "https://api.example.com/service/api/v1",
      ),
    ).toBe("https://api.example.com/service/api/v1/health/?verbose=true");
  });
});

describe("JSON requests", () => {
  it("returns JSON using the versioned URL without automatic credential sharing or redirects", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ status: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestJson("health/", {}, API_BASE)).resolves.toEqual({
      status: "ok",
    });
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      `${API_BASE}health/`,
      expect.objectContaining({
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
      }),
    );
    expect(fetchMock.mock.calls[0][1].headers.get("Accept")).toBe(
      "application/json",
    );
  });

  it("preserves structured validation details and trusts the HTTP status", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: { status_code: 500, details: { name: ["Required."] } } },
            { status: 400 },
          ),
        ),
    );

    await expect(requestJson("example/", {}, API_BASE)).rejects.toMatchObject({
      name: "ApiError",
      kind: "http",
      status: 400,
      details: { name: ["Required."] },
    });
  });

  it("does not expose an upstream HTML error page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html>private server details</html>", {
          status: 502,
          headers: { "Content-Type": "text/html" },
        }),
      ),
    );

    await expect(requestJson("example/", {}, API_BASE)).rejects.toEqual(
      new ApiError("The service could not complete the request.", "http", 502),
    );
  });

  it.each([
    ["application/json", "broken JSON"],
    ["text/html", "<html>unexpected success page</html>"],
  ])("rejects invalid successful response (%s)", async (contentType, body) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(body, { headers: { "Content-Type": contentType } }),
        ),
    );

    await expect(requestJson("example/", {}, API_BASE)).rejects.toMatchObject({
      kind: "invalid_response",
      status: 200,
      details: null,
    });
  });

  it("accepts successful responses with no body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );

    await expect(
      requestJson("example/", {}, API_BASE),
    ).resolves.toBeUndefined();
  });

  it("reports a network failure without retrying a request", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestJson("example/", { method: "POST" }, API_BASE),
    ).rejects.toMatchObject({ kind: "network", status: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("distinguishes caller cancellation from network failure", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")),
    );

    await expect(
      requestJson("example/", { signal: controller.signal }, API_BASE),
    ).rejects.toMatchObject({ kind: "cancelled", status: null });
  });

  it("rejects an escaping path before making any request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestJson("../admin/", {}, API_BASE)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
