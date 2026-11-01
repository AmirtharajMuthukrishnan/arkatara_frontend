/** Server-rendered catalogue reads; browsers never author availability or publication.
 * Refs: BUSINESS_RULES.md R-07, R-09; DECISIONS.md D-20.
 */
import { ApiError, requestJson } from "./api";
import { catalogueMediaOrigins } from "./storefront-config";
import {
  parseCatalogue,
  parseCatalogueDetail,
  type Catalogue,
  type CatalogueQuery,
  type Detail,
} from "./storefront";

export type { CatalogueQuery } from "./storefront";
export class StorefrontUnavailableError extends Error {
  constructor() {
    super("The collection is temporarily unavailable.");
    this.name = "StorefrontUnavailableError";
  }
}
export class StorefrontQueryError extends StorefrontUnavailableError {
  constructor() {
    super();
    this.name = "StorefrontQueryError";
    this.message = "Choose a valid city, material or collection page.";
  }
}
export class StorefrontNotFoundError extends Error {
  constructor() {
    super("The requested catalogue page does not exist.");
    this.name = "StorefrontNotFoundError";
  }
}
function queryString(query: CatalogueQuery): string {
  const params = new URLSearchParams();
  for (const key of ["market", "material", "page"]) {
    const value = query[key];
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) throw new StorefrontQueryError();
    if (
      key === "page"
        ? !/^[1-9]\d{0,8}$/.test(value)
        : !/^[a-zA-Z0-9_-]{1,64}$/.test(value)
    )
      throw new StorefrontQueryError();
    params.set(key, value);
  }
  return params.size ? `?${params.toString()}` : "";
}
async function read(path: string): Promise<unknown> {
  try {
    return await requestJson(path, { signal: AbortSignal.timeout(5000) });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404)
      throw new StorefrontNotFoundError();
    if (error instanceof ApiError && error.status === 400)
      throw new StorefrontQueryError();
    throw new StorefrontUnavailableError();
  }
}
export async function loadCatalogue(
  query: CatalogueQuery = {},
): Promise<Catalogue> {
  try {
    return parseCatalogue(
      await read(`catalogue/${queryString(query)}`),
      catalogueMediaOrigins(),
    );
  } catch (error) {
    if (
      error instanceof StorefrontNotFoundError ||
      error instanceof StorefrontQueryError
    )
      throw error;
    throw new StorefrontUnavailableError();
  }
}
export async function loadCataloguePage(
  slug: string,
  query: CatalogueQuery = {},
): Promise<Detail | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  try {
    const detail = parseCatalogueDetail(
      await read(`catalogue/pages/${slug}/${queryString(query)}`),
      catalogueMediaOrigins(),
    );
    if (detail.page.slug !== slug) throw new StorefrontUnavailableError();
    return detail;
  } catch (error) {
    // Service failure must not turn an existing indexed product into a false 404.
    // Refs: DECISIONS.md D-20.
    if (error instanceof StorefrontNotFoundError) return null;
    if (error instanceof StorefrontQueryError) throw error;
    throw new StorefrontUnavailableError();
  }
}
