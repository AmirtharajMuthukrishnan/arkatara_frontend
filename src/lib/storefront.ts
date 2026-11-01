import { ApiError } from "./api";

export type CatalogueQuery = Record<string, string | string[] | undefined>;
export interface Reference {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "COMING_SOON";
}
export interface Availability {
  state: "AVAILABLE_AT_HUB" | "UNAVAILABLE" | "COMING_SOON" | "UNCONFIGURED";
  bookable: false;
}
export interface PageSummary {
  id: string;
  kind: "PRODUCT" | "CATEGORY" | "MATERIAL";
  slug: string;
  path: string;
  title: string;
  description: string;
  seo_title: string;
  seo_description: string;
}
export interface PublishedImage {
  id: string;
  url: string;
  alt_text: string;
  width: number;
  height: number;
}
export interface ProductSummary extends PageSummary {
  product_id: string;
  material_names: string[];
  availability: Availability;
  price: { state: "UNCONFIGURED" };
  media: PublishedImage[];
}
export interface Catalogue {
  schema_version: 1;
  markets: Reference[];
  materials: Reference[];
  selected_market: Reference | null;
  selected_material: Reference | null;
  collections: PageSummary[];
  products: ProductSummary[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}
export interface ProductVariant {
  id: string;
  sku: string;
  material: Reference;
  purity: Reference | null;
  size_label: string;
  specification: Record<string, unknown>;
  availability: Availability;
}
export interface Detail extends Catalogue {
  page: PageSummary;
  breadcrumbs: { title: string; path: string }[];
  product: null | {
    id: string;
    name: string;
    description: string;
    variants: ProductVariant[];
    availability: Availability;
    price: { state: "UNCONFIGURED" };
    media: PublishedImage[];
  };
}

function invalid(): never {
  throw new ApiError(
    "Invalid published catalogue response.",
    "invalid_response",
  );
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown, empty = false): string {
  if (typeof value !== "string" || (!empty && !value.trim())) invalid();
  return value;
}
function uuid(value: unknown): string {
  const id = text(value);
  if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id)) invalid();
  return id;
}
function integer(value: unknown, minimum = 0): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum
  )
    invalid();
  return value;
}
function list<T>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) invalid();
  return value.map(parse);
}
function choice<const T extends readonly string[]>(
  value: unknown,
  values: T,
): T[number] {
  if (typeof value !== "string" || !values.includes(value)) invalid();
  return value;
}
function reference(value: unknown): Reference {
  const row = object(value);
  return {
    id: uuid(row.id),
    code: text(row.code),
    name: text(row.name),
    status: choice(row.status, ["ACTIVE", "COMING_SOON"] as const),
  };
}
function availability(value: unknown): Availability {
  const row = object(value);
  // A public listing and physical stock observation are not booking authority.
  // Refs: BUSINESS_RULES.md R-07, R-09; DECISIONS.md D-20.
  if (row.bookable !== false) invalid();
  return {
    state: choice(row.state, [
      "AVAILABLE_AT_HUB",
      "UNAVAILABLE",
      "COMING_SOON",
      "UNCONFIGURED",
    ] as const),
    bookable: false,
  };
}
function price(value: unknown): { state: "UNCONFIGURED" } {
  const row = object(value);
  if (row.state !== "UNCONFIGURED" || Object.keys(row).length !== 1) invalid();
  return { state: "UNCONFIGURED" };
}
export function cataloguePath(value: unknown): string {
  const path = text(value);
  if (!/^\/(?:collections|products)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path))
    invalid();
  return path;
}
function page(value: unknown): PageSummary {
  const row = object(value);
  const kind = choice(row.kind, ["PRODUCT", "CATEGORY", "MATERIAL"] as const);
  const slug = text(row.slug);
  const path = cataloguePath(row.path);
  if (path !== `/${kind === "PRODUCT" ? "products" : "collections"}/${slug}`)
    invalid();
  return {
    id: uuid(row.id),
    kind,
    slug,
    path,
    title: text(row.title),
    description: text(row.description),
    seo_title: text(row.seo_title, true),
    seo_description: text(row.seo_description, true),
  };
}
function image(value: unknown, origins: string[]): PublishedImage {
  const row = object(value);
  // Separate public delivery contract: never reuse private object keys or staff URLs.
  // Refs: DECISIONS.md D-19, D-20, BD-15.
  const keys = ["id", "url", "alt_text", "width", "height"];
  if (Object.keys(row).some((key) => !keys.includes(key))) invalid();
  let url: URL;
  try {
    url = new URL(text(row.url));
  } catch {
    return invalid();
  }
  if (
    url.protocol !== "https:" ||
    !origins.includes(url.origin) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    /(?:^|\/)admin(?:\/|$)/.test(url.pathname)
  )
    invalid();
  return {
    id: uuid(row.id),
    url: url.href,
    alt_text: text(row.alt_text),
    width: integer(row.width, 1),
    height: integer(row.height, 1),
  };
}
function productSummary(value: unknown, origins: string[]): ProductSummary {
  const row = object(value);
  const summary = page(row);
  if (summary.kind !== "PRODUCT") invalid();
  return {
    ...summary,
    product_id: uuid(row.product_id),
    material_names: list(row.material_names, (v) => text(v)),
    availability: availability(row.availability),
    price: price(row.price),
    media: list(row.media, (v) => image(v, origins)),
  };
}
export function parseCatalogue(
  value: unknown,
  origins: string[] = [],
): Catalogue {
  const row = object(value);
  if (row.schema_version !== 1) invalid();
  const markets = list(row.markets, reference);
  const materials = list(row.materials, reference);
  const selected_market =
    row.selected_market === null ? null : reference(row.selected_market);
  const selected_material =
    row.selected_material === null ? null : reference(row.selected_material);
  for (const [selected, options] of [
    [selected_market, markets],
    [selected_material, materials],
  ] as const) {
    if (
      selected &&
      !options.some(
        (entry) =>
          entry.id === selected.id &&
          entry.code === selected.code &&
          entry.status === selected.status,
      )
    )
      invalid();
  }
  const pagination = object(row.pagination);
  const result: Catalogue = {
    schema_version: 1,
    markets,
    materials,
    selected_market,
    selected_material,
    collections: list(row.collections, (item) => {
      const parsed = page(item);
      if (parsed.kind === "PRODUCT") invalid();
      return parsed;
    }),
    products: list(row.products, (item) => productSummary(item, origins)),
    pagination: {
      page: integer(pagination.page, 1),
      page_size: integer(pagination.page_size, 1),
      total_items: integer(pagination.total_items),
      total_pages: integer(pagination.total_pages, 1),
    },
  };
  if (
    result.pagination.page > result.pagination.total_pages ||
    result.products.length > result.pagination.page_size
  )
    invalid();
  if (
    (!selected_market ||
      selected_market.status !== "ACTIVE" ||
      selected_material?.status === "COMING_SOON") &&
    result.products.some(
      (entry) => entry.availability.state === "AVAILABLE_AT_HUB",
    )
  )
    invalid();
  return result;
}
function checkAvailabilityContext(
  catalogue: Catalogue,
  states: Availability[],
) {
  if (
    (!catalogue.selected_market ||
      catalogue.selected_market.status !== "ACTIVE" ||
      catalogue.selected_material?.status === "COMING_SOON") &&
    states.some((entry) => entry.state === "AVAILABLE_AT_HUB")
  )
    invalid();
}
export function parseCatalogueDetail(
  value: unknown,
  origins: string[] = [],
): Detail {
  const row = object(value);
  const catalogue = parseCatalogue(row, origins);
  const summary = page(row.page);
  const breadcrumbs = list(row.breadcrumbs, (item) => {
    const crumb = object(item);
    return {
      title: text(crumb.title),
      path: crumb.path === "/" ? "/" : cataloguePath(crumb.path),
    };
  });
  if ((summary.kind === "PRODUCT") !== (row.product !== null)) invalid();
  if (row.product === null)
    return { ...catalogue, page: summary, breadcrumbs, product: null };
  const product = object(row.product);
  const result: Detail = {
    ...catalogue,
    page: summary,
    breadcrumbs,
    product: {
      id: uuid(product.id),
      name: text(product.name),
      description: text(product.description, true),
      variants: list(product.variants, (item) => {
        const variant = object(item);
        const material = reference(variant.material);
        const purity =
          variant.purity === null ? null : reference(variant.purity);
        if (
          material.status !== "ACTIVE" ||
          (purity && purity.status !== "ACTIVE") ||
          (catalogue.selected_material &&
            material.id !== catalogue.selected_material.id)
        )
          invalid();
        return {
          id: uuid(variant.id),
          sku: text(variant.sku),
          material,
          purity,
          size_label: text(variant.size_label, true),
          specification: object(variant.specification),
          availability: availability(variant.availability),
        };
      }),
      availability: availability(product.availability),
      price: price(product.price),
      media: list(product.media, (item) => image(item, origins)),
    },
  };
  checkAvailabilityContext(catalogue, [
    result.product!.availability,
    ...result.product!.variants.map((variant) => variant.availability),
  ]);
  return result;
}
