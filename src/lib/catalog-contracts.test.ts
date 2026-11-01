import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "./api";
import {
  checkServiceability,
  getReferenceData,
  parseAvailability,
  parsePriceDisplay,
  parseProductVariantSummary,
  parseReferenceData,
  parseServiceability,
} from "./catalog-contracts";

const API_BASE = "https://api.example.com/api/v1/";
const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
];
const references = {
  schema_version: 1,
  markets: [
    {
      id: ids[0],
      code: "NEW-CITY",
      name: "Scenario city",
      country_code: "IN",
      status: "COMING_SOON",
    },
  ],
  materials: [
    { id: ids[1], code: "NEW-METAL", name: "Scenario metal", status: "ACTIVE" },
  ],
  purities: [
    {
      id: ids[2],
      code: "NEW-SPEC",
      name: "Scenario purity",
      material_id: ids[1],
      status: "ACTIVE",
    },
  ],
  categories: [],
};
const coverage = {
  market_code: "NEW-CITY",
  country_code: "IN",
  postal_code: "560001",
  state: "CONFIGURED",
  bookable: false,
};
const draft = {
  status: "DRAFT",
  mode: "FIXED",
  currency: "INR",
  fixed_amount: "123456789012345678.123456",
  weight_value: null,
  weight_unit: "",
  rate_amount: null,
  rate_unit: "",
  rate_source_reference: "",
  formula_reference: "",
  charges: [],
};

afterEach(() => vi.unstubAllGlobals());

describe("catalogue reference contracts", () => {
  it("accepts arbitrary new cities and materials with their server status", () => {
    const result = parseReferenceData(references);
    expect(result.markets[0].code).toBe("NEW-CITY");
    expect(result.markets[0].status).toBe("COMING_SOON");
    expect(result.materials[0].code).toBe("NEW-METAL");
    expect(result.purities[0].material_id).toBe(ids[1]);
    expect(result.markets[0]).not.toHaveProperty("bookable");
  });

  it.each([
    undefined,
    {},
    { ...references, schema_version: 2 },
    { ...references, markets: [{ ...references.markets[0], id: "invalid" }] },
    {
      ...references,
      markets: [{ ...references.markets[0], id: `${ids[0]}\n` }],
    },
    {
      ...references,
      markets: [{ ...references.markets[0], country_code: "IN\n" }],
    },
    {
      ...references,
      materials: [{ ...references.materials[0], status: "DRAFT" }],
    },
    { ...references, categories: null },
  ])("rejects malformed or private reference responses", (data) => {
    expect(() => parseReferenceData(data)).toThrow(ApiError);
  });

  it("keeps variant, product, material and purity identities distinct", () => {
    const variant = parseProductVariantSummary({
      id: ids[0],
      sku: "opaque-sku",
      product_id: ids[1],
      category_id: ids[2],
      material_id: ids[1],
      purity_id: null,
      size: "",
      status: "DRAFT",
    });
    expect(variant.id).not.toBe(variant.product_id);
    expect(variant.purity_id).toBeNull();
  });

  it("validates reference JSON returned by the versioned API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(references));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getReferenceData({}, API_BASE)).resolves.toEqual(references);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}reference-data/`,
      expect.any(Object),
    );
    fetchMock.mockResolvedValue(Response.json({ schema_version: 1 }));
    await expect(getReferenceData({}, API_BASE)).rejects.toMatchObject({
      kind: "invalid_response",
    });
  });
});

describe("coverage and availability boundaries", () => {
  it.each([
    "CONFIGURED",
    "UNCONFIGURED",
    "COMING_SOON",
    "INACTIVE",
    "CONFLICT",
  ])("coverage %s alone cannot enable a booking", (state) => {
    expect(parseServiceability({ ...coverage, state }).bookable).toBe(false);
    expect(() =>
      parseServiceability({ ...coverage, state, bookable: true }),
    ).toThrow(ApiError);
  });

  it.each(["UNCONFIGURED", "UNAVAILABLE", "COMING_SOON"])(
    "rejects bookability for %s",
    (state) => {
      expect(() => parseAvailability({ state, bookable: true })).toThrow(
        ApiError,
      );
      expect(parseAvailability({ state, bookable: false }).bookable).toBe(
        false,
      );
    },
  );

  it("preserves the backend decision even when readiness is READY", () => {
    expect(
      parseAvailability({ state: "READY", bookable: false }).bookable,
    ).toBe(false);
    expect(parseAvailability({ state: "READY", bookable: true }).bookable).toBe(
      true,
    );
  });

  it("encodes selected market and postal identifiers without merging query values", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        ...coverage,
        country_code: "GB",
        postal_code: "SW1A 1AA",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await checkServiceability(
      { market: "NEW-CITY", country_code: "GB", postal_code: "SW1A 1AA" },
      {},
      API_BASE,
    );
    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.pathname).toBe("/api/v1/serviceability/");
    expect(url.searchParams.get("postal_code")).toBe("SW1A 1AA");
    expect(url.searchParams.get("market")).toBe("NEW-CITY");
  });
});

describe("draft pricing is exact evidence", () => {
  it("preserves large decimal text without floating point conversion", () => {
    expect(parsePriceDisplay(draft).fixed_amount).toBe(
      "123456789012345678.123456",
    );
    expect(
      parsePriceDisplay({ ...draft, fixed_amount: null }).fixed_amount,
    ).toBeNull();
  });

  it("represents weight and rate inputs without computing a sale amount", () => {
    const result = parsePriceDisplay({
      ...draft,
      mode: "WEIGHT_BASED",
      fixed_amount: null,
      weight_value: "2.123456",
      weight_unit: "scenario-unit",
      rate_amount: "4.567890",
      rate_unit: "scenario-rate-unit",
      rate_source_reference: "scenario-source",
      charges: [
        {
          code: "scenario-component",
          amount: "0.123456",
          source_reference: "scenario",
        },
      ],
    });
    expect(result.mode).toBe("WEIGHT_BASED");
    expect(result.fixed_amount).toBeNull();
    expect(result.charges[0].amount).toBe("0.123456");
  });

  it.each([
    1.25,
    "1.1234567",
    "NaN",
    "Infinity",
    "-1",
    "1e3",
    "1.25\n",
    "1000000000000000000",
  ])("rejects lossy or unsupported amount %s", (fixed_amount) => {
    expect(() => parsePriceDisplay({ ...draft, fixed_amount })).toThrow(
      ApiError,
    );
  });

  it("rejects live status claims, fixed prices on weight mode, and weights without units", () => {
    for (const data of [
      { ...draft, status: "ACTIVE" },
      { ...draft, currency: "INR\n" },
      { ...draft, mode: "WEIGHT_BASED" },
      { ...draft, weight_value: "2.5" },
      { ...draft, weight_value: "0.000000", weight_unit: "g" },
    ])
      expect(() => parsePriceDisplay(data)).toThrow(ApiError);
  });
});
