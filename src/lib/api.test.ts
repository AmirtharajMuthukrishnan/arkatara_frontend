import { describe, expect, it } from "vitest";

import { buildApiUrl, getApiBaseUrl } from "./api";

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
});
