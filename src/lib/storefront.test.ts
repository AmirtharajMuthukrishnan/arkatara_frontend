import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseCatalogue,
  parseCatalogueDetail,
  type Detail,
} from "./storefront";
import {
  loadCatalogue,
  loadCataloguePage,
  StorefrontNotFoundError,
  StorefrontQueryError,
  StorefrontUnavailableError,
} from "./storefront-server";
import { catalogueMediaOrigins } from "./storefront-config";

const identity = "11111111-1111-4111-8111-111111111111";
const materialId = "22222222-2222-4222-8222-222222222222";
const market = {
  id: identity,
  code: "TEST-CITY",
  name: "Fictional city",
  status: "ACTIVE" as const,
};
const material = {
  id: materialId,
  code: "TEST-MATERIAL",
  name: "Fictional material",
  status: "ACTIVE" as const,
};
function fixture(): Detail {
  return {
    schema_version: 1,
    markets: [market],
    materials: [material],
    selected_market: market,
    selected_material: material,
    collections: [],
    products: [],
    pagination: { page: 1, page_size: 12, total_items: 0, total_pages: 1 },
    page: {
      id: identity,
      kind: "PRODUCT",
      slug: "fictional-piece",
      path: "/products/fictional-piece",
      title: "Fictional piece",
      description: "Fictional description",
      seo_title: "",
      seo_description: "",
    },
    breadcrumbs: [
      { title: "Home", path: "/" },
      { title: "Fictional piece", path: "/products/fictional-piece" },
    ],
    product: {
      id: identity,
      name: "Fictional piece",
      description: "Fictional description",
      variants: [
        {
          id: identity,
          sku: "opaque",
          material,
          purity: null,
          size_label: "",
          specification: {},
          availability: { state: "UNAVAILABLE", bookable: false },
        },
      ],
      availability: { state: "UNAVAILABLE", bookable: false },
      price: { state: "UNCONFIGURED" },
      media: [],
    },
  };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("published catalogue contract", () => {
  it("keeps the public shape separate from private identities and draft prices", () => {
    const data = fixture();
    expect(parseCatalogueDetail(data)).toEqual(data);
    expect(parseCatalogue(data).selected_material?.code).toBe("TEST-MATERIAL");
    expect(() =>
      parseCatalogueDetail({
        ...data,
        product: { ...data.product, price: { state: "DRAFT", amount: "1.00" } },
      }),
    ).toThrow();
  });
  it.each([
    "//external.invalid",
    "/admin/private",
    "/products/another-piece",
    "/products/fictional-piece?market=x",
  ])("rejects a mismatched or private public path: %s", (path) => {
    const data = fixture();
    data.page.path = path;
    expect(() => parseCatalogueDetail(data)).toThrow();
  });
  it("rejects nested in-stock claims for coming-soon or absent market context", () => {
    for (const absent of [false, true]) {
      const data = fixture();
      data.selected_market = absent
        ? null
        : { ...market, status: "COMING_SOON" };
      data.markets = absent ? [] : [data.selected_market!];
      data.product!.availability.state = "AVAILABLE_AT_HUB";
      data.product!.variants[0].availability.state = "AVAILABLE_AT_HUB";
      expect(() => parseCatalogueDetail(data)).toThrow();
    }
  });
  it("rejects a variant from another selected material and bookable overrides", () => {
    const data = fixture();
    data.product!.variants[0].material = { ...material, id: identity };
    expect(() => parseCatalogueDetail(data)).toThrow();
    expect(() =>
      parseCatalogueDetail({
        ...fixture(),
        product: {
          ...fixture().product,
          availability: { state: "AVAILABLE_AT_HUB", bookable: true },
        },
      }),
    ).toThrow();
  });
  it("accepts only explicit HTTPS public image origins and dimensions", () => {
    const data = fixture();
    data.product!.media = [
      {
        id: identity,
        url: "https://images.example.invalid/piece.jpg",
        alt_text: "Fictional piece side view",
        width: 800,
        height: 1000,
      },
    ];
    expect(() => parseCatalogueDetail(data)).toThrow();
    expect(
      parseCatalogueDetail(data, ["https://images.example.invalid"]).product
        ?.media[0].width,
    ).toBe(800);
    data.product!.media[0].url =
      "https://images.example.invalid/admin/private.jpg";
    expect(() =>
      parseCatalogueDetail(data, ["https://images.example.invalid"]),
    ).toThrow();
  });
  it("rejects private fields in the public media contract", () => {
    const data = fixture();
    const media = {
      id: identity,
      url: "https://images.example.invalid/piece.jpg",
      alt_text: "Fixture",
      width: 20,
      height: 20,
      object_key: "private/key",
    };
    expect(() =>
      parseCatalogueDetail(
        { ...data, product: { ...data.product, media: [media] } },
        ["https://images.example.invalid"],
      ),
    ).toThrow();
  });
  it("requires plain configured media origins", () => {
    expect(catalogueMediaOrigins("")).toEqual([]);
    expect(
      catalogueMediaOrigins(
        "https://images.example.invalid,https://images.example.invalid/",
      ),
    ).toEqual(["https://images.example.invalid"]);
    for (const origin of [
      "http://example.invalid",
      "https://user:secret@example.invalid",
      "https://example.invalid/path",
      "https://example.invalid/?secret=x",
    ])
      expect(() => catalogueMediaOrigins(origin)).toThrow();
  });
});
describe("server catalogue requests", () => {
  function respond(payload: unknown, status = 200) {
    vi.stubEnv(
      "NEXT_PUBLIC_API_BASE_URL",
      "https://api.example.invalid/api/v1/",
    );
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    return fetcher;
  }
  it("returns null for a missing page and distinguishes a service failure", async () => {
    respond({}, 404);
    await expect(loadCataloguePage("fictional-piece")).resolves.toBeNull();
    await expect(loadCatalogue()).rejects.toBeInstanceOf(
      StorefrontNotFoundError,
    );
    respond({}, 503);
    await expect(loadCataloguePage("fictional-piece")).rejects.toBeInstanceOf(
      StorefrontUnavailableError,
    );
  });
  it("binds the detail identity to the requested slug", async () => {
    respond(fixture());
    await expect(loadCataloguePage("another-piece")).rejects.toBeInstanceOf(
      StorefrontUnavailableError,
    );
  });
  it("normalizes tracking out of API queries while retaining explicit city context", async () => {
    const fetcher = respond(fixture());
    await loadCataloguePage("fictional-piece", {
      market: "TEST-CITY",
      utm_source: "fictional",
    });
    expect(fetcher.mock.calls[0][0]).toBe(
      "https://api.example.invalid/api/v1/catalogue/pages/fictional-piece/?market=TEST-CITY",
    );
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
    });
  });
  it.each([
    { page: "0" },
    { page: "1234567890" },
    { material: ["A", "B"] },
    { market: "../private" },
  ])("rejects invalid query input before fetching %j", async (query) => {
    const fetcher = respond(fixture());
    await expect(loadCatalogue(query)).rejects.toBeInstanceOf(
      StorefrontQueryError,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("distinguishes a backend selector rejection from an outage", async () => {
    respond({}, 400);
    await expect(loadCatalogue({ market: "UNKNOWN" })).rejects.toBeInstanceOf(
      StorefrontQueryError,
    );
  });
});
