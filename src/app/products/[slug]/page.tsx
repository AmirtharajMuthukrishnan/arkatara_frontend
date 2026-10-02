import { notFound } from "next/navigation";
import {
  Breadcrumbs,
  CatalogueSelectors,
  CatalogueUnavailable,
  ProductDetail,
} from "@/components/storefront";
import {
  breadcrumbSchema,
  jsonLd,
  pageMetadata,
  productSchema,
} from "@/lib/seo";
import {
  loadCataloguePage,
  StorefrontQueryError,
  type CatalogueQuery,
} from "@/lib/storefront-server";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogueQuery>;
};

async function productFor(slug: string, query: CatalogueQuery) {
  try {
    const detail = await loadCataloguePage(slug, { ...query, page: undefined });
    if (!detail || detail.page.kind !== "PRODUCT" || !detail.product)
      notFound();
    return detail;
  } catch (error) {
    if (error instanceof StorefrontQueryError)
      return "invalid-selection" as const;
    throw error;
  }
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const result = await productFor(slug, query);
  const detail = result === "invalid-selection" ? null : result;
  if (!detail)
    return pageMetadata({
      title: "Choose your collection",
      description:
        "Choose a valid city, material or collection page to continue browsing.",
      path: `/products/${encodeURIComponent(slug)}`,
      noindex: true,
    });
  return pageMetadata({
    title: detail.page.seo_title || detail.page.title,
    description: detail.page.seo_description || detail.page.description,
    path: detail.page.path,
    noindex: Object.keys(query).length > 0,
  });
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const query = await searchParams;
  const result = await productFor((await params).slug, query);
  const detail = result === "invalid-selection" ? null : result;
  if (!detail)
    return (
      <main id="main-content" className="page-shell">
        <h1 className="unavailable-heading">A closer look.</h1>
        <CatalogueUnavailable invalidSelection />
      </main>
    );
  const schema = productSchema(detail);
  return (
    <main id="main-content" className="page-shell product-page">
      <Breadcrumbs items={detail.breadcrumbs} query={query} />
      <ProductDetail detail={detail} />
      <CatalogueSelectors catalogue={detail} action={detail.page.path} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(breadcrumbSchema(detail.breadcrumbs)),
        }}
      />
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
        />
      )}
    </main>
  );
}
