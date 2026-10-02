import { afterEach, expect, it, vi } from "vitest";
import {
  breadcrumbSchema,
  jsonLd,
  organizationSchema,
  pageMetadata,
  productSchema,
  websiteSchema,
} from "./seo";
import type { Detail } from "./storefront";

afterEach(() => vi.unstubAllEnvs());
it("uses the official canonical identity and requires explicit indexing release", () => {
  vi.stubEnv("SITE_INDEXING_ENABLED", "false");
  const values = {
    title: "Fictional collection",
    description: "Fictional description",
    path: "/collections/fictional?page=2",
  };
  expect(pageMetadata(values)).toMatchObject({
    alternates: {
      canonical: "https://arkatara.in/collections/fictional?page=2",
    },
    robots: { index: false },
  });
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  expect(pageMetadata(values).robots).toMatchObject({ index: true });
  expect(pageMetadata({ ...values, noindex: true }).robots).toMatchObject({
    index: false,
  });
  expect(
    pageMetadata({ ...values, path: "/collections?page=1" }).alternates,
  ).toEqual({ canonical: "https://arkatara.in/collections" });
});
it.each([
  "https://example.invalid",
  "//example.invalid/path",
  "/collections?market=X",
  "/collections?utm_source=x",
  "/collections?page=-1",
  "/collections#section",
])("rejects noncanonical identities %s", (path) => {
  expect(() =>
    pageMetadata({ title: "Fixture", description: "Fixture", path }),
  ).toThrow();
});
it("escapes script termination and Unicode separators in published text", () => {
  const text = "</script><script>alert(1)</script>\u2028\u2029";
  const result = jsonLd({ name: text });
  expect(result).not.toContain("<");
  expect(result).not.toContain("\u2028");
  expect(JSON.parse(result).name).toBe(text);
});
it("uses brand facts without inventing premises, ratings or a legal entity", () => {
  expect(organizationSchema()).toMatchObject({
    "@type": "Organization",
    name: "Arka Tara",
    url: "https://arkatara.in/",
  });
  expect(organizationSchema()).not.toHaveProperty("address");
  expect(organizationSchema()).not.toHaveProperty("legalName");
  expect(websiteSchema()).not.toHaveProperty("potentialAction");
  const trail = breadcrumbSchema([
    { title: "Home", path: "/" },
    { title: "Fixture", path: "/collections/fixture" },
  ]);
  expect(trail.itemListElement[1]).toMatchObject({
    position: 2,
    item: "https://arkatara.in/collections/fixture",
  });
});
it("does not transform unpublished prices, local stock or empty media into offers", () => {
  const detail = {
    page: {
      kind: "PRODUCT",
      path: "/products/fixture",
      description: "Visible fixture text",
    },
    product: {
      id: "fixture",
      name: "Visible fixture",
      media: [],
      price: { state: "UNCONFIGURED" },
      availability: { state: "AVAILABLE_AT_HUB", bookable: false },
    },
  } as unknown as Detail;
  const schema = productSchema(detail);
  expect(schema).toMatchObject({
    "@type": "Product",
    name: "Visible fixture",
    description: "Visible fixture text",
  });
  for (const key of [
    "offers",
    "review",
    "aggregateRating",
    "image",
    "availability",
  ])
    expect(schema).not.toHaveProperty(key);
});
