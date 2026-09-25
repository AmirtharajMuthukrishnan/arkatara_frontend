import { ApiError, requestJson } from "./api";

export type ReferenceStatus = "DRAFT" | "ACTIVE" | "COMING_SOON" | "INACTIVE";
export type PublicReferenceStatus = Extract<
  ReferenceStatus,
  "ACTIVE" | "COMING_SOON"
>;

export interface ReferenceSummary {
  id: string;
  code: string;
  name: string;
  status: PublicReferenceStatus;
}

export interface MarketSummary extends ReferenceSummary {
  country_code: string;
}

export type MaterialSummary = ReferenceSummary;
export type CategorySummary = ReferenceSummary;

export interface PuritySummary extends ReferenceSummary {
  material_id: string;
}

export interface ReferenceData {
  schema_version: 1;
  markets: MarketSummary[];
  materials: MaterialSummary[];
  purities: PuritySummary[];
  categories: CategorySummary[];
}

export interface ProductVariantSummary {
  id: string;
  sku: string;
  product_id: string;
  category_id: string;
  material_id: string;
  purity_id: string | null;
  size: string;
  status: ReferenceStatus;
}

declare const decimalString: unique symbol;

/** Exact decimal text; do not coerce money or weight to a JavaScript Number. */
export type DecimalString = string & { readonly [decimalString]: true };

export interface PriceCharge {
  code: string;
  amount: DecimalString;
  source_reference: string;
}

interface DraftPriceInputs {
  status: "DRAFT";
  currency: string;
  weight_value: DecimalString | null;
  weight_unit: string;
  rate_amount: DecimalString | null;
  rate_unit: string;
  rate_source_reference: string;
  formula_reference: string;
  charges: PriceCharge[];
}

/** Draft input representation only: neither branch is an approved sale price. */
export type PriceDisplay = DraftPriceInputs &
  (
    | { mode: "FIXED"; fixed_amount: DecimalString | null }
    | { mode: "WEIGHT_BASED"; fixed_amount: null }
  );

/** A backend readiness result, never inferred from reference-data activation. */
export type Availability =
  | {
      state: "UNCONFIGURED" | "UNAVAILABLE" | "COMING_SOON";
      bookable: false;
    }
  | { state: "READY"; bookable: boolean };

export type ServiceabilityState =
  "CONFIGURED" | "UNCONFIGURED" | "COMING_SOON" | "INACTIVE" | "CONFLICT";

export interface ServiceabilityQuery {
  market: string;
  country_code: string;
  postal_code: string;
}

/** CONFIGURED confirms coverage configuration only; it does not enable booking. */
export interface ServiceabilityResult {
  market_code: string;
  country_code: string;
  postal_code: string;
  state: ServiceabilityState;
  bookable: false;
}

type ReadOptions = Pick<RequestInit, "signal">;
type JsonObject = Record<string, unknown>;

function invalidResponse(): never {
  throw new ApiError(
    "The service returned an unexpected catalogue response.",
    "invalid_response",
  );
}

function object(value: unknown): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalidResponse();
  }
  return value as JsonObject;
}

function string(value: unknown, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && value.trim() === "")) {
    return invalidResponse();
  }
  return value;
}

function uuid(value: unknown): string {
  const id = string(value);
  if (
    id !== id.trim() ||
    !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)
  ) {
    return invalidResponse();
  }
  return id;
}

function oneOf<const T extends readonly string[]>(
  value: unknown,
  values: T,
): T[number] {
  if (typeof value !== "string" || !values.includes(value)) {
    return invalidResponse();
  }
  return value;
}

function list<T>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) {
    return invalidResponse();
  }
  return value.map(parse);
}

function countryCode(value: unknown): string {
  const code = string(value);
  if (code !== code.trim() || !/^[A-Z]{2}$/.test(code)) {
    return invalidResponse();
  }
  return code;
}

function decimal(value: unknown): DecimalString {
  const text = string(value);
  // Match the backend's technical precision (24 total, 6 fractional digits).
  if (text !== text.trim() || !/^\d{1,18}(?:\.\d{1,6})?$/.test(text)) {
    return invalidResponse();
  }
  return text as DecimalString;
}

function nullableDecimal(value: unknown): DecimalString | null {
  return value === null ? null : decimal(value);
}

function reference(value: unknown): ReferenceSummary {
  const entry = object(value);
  return {
    id: uuid(entry.id),
    code: string(entry.code),
    name: string(entry.name),
    status: oneOf(entry.status, ["ACTIVE", "COMING_SOON"]),
  };
}

/** Validate untrusted JSON while allowing additive fields in the same schema. */
export function parseReferenceData(value: unknown): ReferenceData {
  const data = object(value);
  if (data.schema_version !== 1) {
    return invalidResponse();
  }
  return {
    schema_version: 1,
    markets: list(data.markets, (item) => {
      const market = object(item);
      return {
        ...reference(market),
        country_code: countryCode(market.country_code),
      };
    }),
    materials: list(data.materials, reference),
    purities: list(data.purities, (item) => {
      const purity = object(item);
      return { ...reference(purity), material_id: uuid(purity.material_id) };
    }),
    categories: list(data.categories, reference),
  };
}

export function parseProductVariantSummary(
  value: unknown,
): ProductVariantSummary {
  const variant = object(value);
  return {
    id: uuid(variant.id),
    sku: string(variant.sku),
    product_id: uuid(variant.product_id),
    category_id: uuid(variant.category_id),
    material_id: uuid(variant.material_id),
    purity_id: variant.purity_id === null ? null : uuid(variant.purity_id),
    size: string(variant.size, true),
    status: oneOf(variant.status, [
      "DRAFT",
      "ACTIVE",
      "COMING_SOON",
      "INACTIVE",
    ]),
  };
}

export function parsePriceDisplay(value: unknown): PriceDisplay {
  const price = object(value);
  const status = oneOf(price.status, ["DRAFT"]);
  const mode = oneOf(price.mode, ["FIXED", "WEIGHT_BASED"]);
  const currency = string(price.currency);
  if (currency !== currency.trim() || !/^[A-Z]{3}$/.test(currency)) {
    return invalidResponse();
  }

  const fixedAmount = nullableDecimal(price.fixed_amount);
  const weightValue = nullableDecimal(price.weight_value);
  const weightUnit = string(price.weight_unit, true);
  const rateAmount = nullableDecimal(price.rate_amount);
  const rateUnit = string(price.rate_unit, true);
  const rateSourceReference = string(price.rate_source_reference, true);

  if (
    (weightValue === null ? weightUnit !== "" : weightUnit.trim() === "") ||
    (weightValue !== null && !/[1-9]/.test(weightValue)) ||
    (rateAmount === null ? rateUnit !== "" : rateUnit.trim() === "") ||
    (rateAmount === null && rateSourceReference !== "")
  ) {
    return invalidResponse();
  }

  const inputs: DraftPriceInputs = {
    status,
    currency,
    weight_value: weightValue,
    weight_unit: weightUnit,
    rate_amount: rateAmount,
    rate_unit: rateUnit,
    rate_source_reference: rateSourceReference,
    formula_reference: string(price.formula_reference, true),
    charges: list(price.charges, (item) => {
      const charge = object(item);
      return {
        code: string(charge.code),
        amount: decimal(charge.amount),
        source_reference: string(charge.source_reference, true),
      };
    }),
  };
  if (mode === "WEIGHT_BASED") {
    if (fixedAmount !== null) {
      return invalidResponse();
    }
    return { ...inputs, mode, fixed_amount: null };
  }
  return { ...inputs, mode, fixed_amount: fixedAmount };
}

export function parseAvailability(value: unknown): Availability {
  const availability = object(value);
  const state = oneOf(availability.state, [
    "UNCONFIGURED",
    "UNAVAILABLE",
    "COMING_SOON",
    "READY",
  ]);
  if (typeof availability.bookable !== "boolean") {
    return invalidResponse();
  }
  if (state === "READY") {
    return { state, bookable: availability.bookable };
  }
  if (availability.bookable !== false) {
    return invalidResponse();
  }
  return { state, bookable: false };
}

export function parseServiceability(value: unknown): ServiceabilityResult {
  const serviceability = object(value);
  if (serviceability.bookable !== false) {
    return invalidResponse();
  }
  return {
    market_code: string(serviceability.market_code),
    country_code: countryCode(serviceability.country_code),
    postal_code: string(serviceability.postal_code),
    state: oneOf(serviceability.state, [
      "CONFIGURED",
      "UNCONFIGURED",
      "COMING_SOON",
      "INACTIVE",
      "CONFLICT",
    ]),
    bookable: false,
  };
}

export async function getReferenceData(
  options: ReadOptions = {},
  configuredUrl?: string,
): Promise<ReferenceData> {
  return parseReferenceData(
    await requestJson<unknown>("reference-data/", options, configuredUrl),
  );
}

export async function checkServiceability(
  query: ServiceabilityQuery,
  options: ReadOptions = {},
  configuredUrl?: string,
): Promise<ServiceabilityResult> {
  const parameters = new URLSearchParams({
    market: query.market,
    country_code: query.country_code,
    postal_code: query.postal_code,
  });
  return parseServiceability(
    await requestJson<unknown>(
      `serviceability/?${parameters.toString()}`,
      options,
      configuredUrl,
    ),
  );
}
