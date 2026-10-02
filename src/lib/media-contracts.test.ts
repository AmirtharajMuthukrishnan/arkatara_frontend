import { describe, expect, it } from "vitest";

import { parseProductMediaMetadata } from "./media-contracts";

const fixture = {
  schema_version: 1,
  id: "f54da8ef-f6ef-4ac1-a3d5-79be497f8c47",
  product_id: "2ed7d83e-b77f-46f1-bd5c-b8908e02f244",
  source_media_id: null,
  role: "MAIN",
  status: "DRAFT",
  sort_order: 0,
  alt_text: "Fictional catalogue image",
  content_type: "image/png",
  byte_size: 123,
  sha256: "a".repeat(64),
  delivery: { state: "PRIVATE" },
};

describe("private product media contract", () => {
  it("retains metadata without deriving a URL or publication state", () => {
    const metadata = parseProductMediaMetadata(fixture);
    expect(metadata).toEqual(fixture);
    expect(metadata).not.toHaveProperty("url");
    metadata.delivery.state = "PRIVATE";
    expect(metadata.delivery).not.toBe(fixture.delivery);
  });

  it("represents additional images, video and source-linked thumbnails", () => {
    expect(
      parseProductMediaMetadata({ ...fixture, role: "ADDITIONAL" }).role,
    ).toBe("ADDITIONAL");
    expect(
      parseProductMediaMetadata({
        ...fixture,
        role: "VIDEO",
        content_type: "video/mp4",
      }).role,
    ).toBe("VIDEO");
    expect(
      parseProductMediaMetadata({
        ...fixture,
        role: "THUMBNAIL",
        source_media_id: fixture.product_id,
      }).source_media_id,
    ).toBe(fixture.product_id);
  });

  it.each([
    { delivery: { state: "PUBLIC", url: "https://example.test/asset" } },
    { status: "ACTIVE" },
    { object_key: "private/asset.png" },
    { url: "javascript:alert(1)" },
    { content_type: "image/svg+xml" },
    { role: "VIDEO" },
    { role: "THUMBNAIL" },
    { source_media_id: fixture.product_id },
    { id: "../../private" },
    { alt_text: " " },
    { byte_size: 0 },
    { byte_size: 1.5 },
    { byte_size: Number.MAX_SAFE_INTEGER + 1 },
    { sort_order: -1 },
    { sort_order: "1" },
    { sha256: "invalid" },
    { schema_version: 2 },
  ])("rejects invalid or publication-implying metadata: %o", (overrides) => {
    expect(() =>
      parseProductMediaMetadata({ ...fixture, ...overrides }),
    ).toThrow();
  });
});
