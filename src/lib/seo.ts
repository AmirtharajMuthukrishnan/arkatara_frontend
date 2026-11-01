import type { Metadata } from "next";
import type { Detail } from "./storefront";

export const SITE_ORIGIN = "https://arkatara.in";
export const BRAND = "Arka Tara";

function canonicalUrl(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\"))
    throw new Error("Use a local canonical path.");
  const url = new URL(path, SITE_ORIGIN);
  if (
    url.origin !== SITE_ORIGIN ||
    url.hash ||
    [...url.searchParams.keys()].some((key) => key !== "page")
  )
    throw new Error("Canonical paths must exclude filters and tracking.");
  const page = url.searchParams.get("page");
  if (page && !/^[1-9]\d*$/.test(page))
    throw new Error("Invalid canonical page.");
  if (page === "1") url.searchParams.delete("page");
  return url.href;
}
/** Metadata follows the rendered page, never an invented city or product claim.
 * Refs: DECISIONS.md D-20; BUSINESS_RULES.md R-07, R-13.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const canonical = canonicalUrl(path);
  const index = process.env.SITE_INDEXING_ENABLED === "true" && !noindex;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: BRAND,
      title,
      description,
      url: canonical,
      locale: "en_IN",
    },
    robots: { index, follow: true },
  };
}
/** Escape script terminators even when reviewed catalogue text contains markup.
 * Refs: DECISIONS.md D-14, D-20.
 */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: BRAND,
    url: `${SITE_ORIGIN}/`,
  };
}
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    name: BRAND,
    url: `${SITE_ORIGIN}/`,
    publisher: { "@id": `${SITE_ORIGIN}/#organization` },
  };
}
export function breadcrumbSchema(items: { title: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      item: canonicalUrl(item.path),
    })),
  };
}
export function productSchema(detail: Detail) {
  if (!detail.product || detail.page.kind !== "PRODUCT") return null;
  // Public product facts only. Draft prices, hub counts and booking availability
  // are not Schema.org offers, ratings or evidence of a verified purchase.
  // Refs: BUSINESS_RULES.md R-07, R-27; DECISIONS.md D-20, BD-04, CA-02.
  const product = detail.product;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonicalUrl(detail.page.path)}#product`,
    url: canonicalUrl(detail.page.path),
    name: product.name,
    description: detail.page.description,
    productID: product.id,
    brand: { "@type": "Brand", name: BRAND },
    ...(product.media.length
      ? { image: product.media.map((entry) => entry.url) }
      : {}),
  };
}
