import { notFound } from "next/navigation";
import {
  Breadcrumbs,
  CatalogueSelectors,
  CatalogueUnavailable,
  Pagination,
  ProductCards,
} from "@/components/storefront";
import { breadcrumbSchema, jsonLd, pageMetadata } from "@/lib/seo";
import {
  loadCataloguePage,
  StorefrontQueryError,
  type CatalogueQuery,
} from "@/lib/storefront-server";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogueQuery>;
};

async function collectionFor(slug: string, query: CatalogueQuery) {
  try {
    const detail = await loadCataloguePage(slug, query);
    if (!detail || detail.page.kind === "PRODUCT") notFound();
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
  const result = await collectionFor(slug, query);
  const detail = result === "invalid-selection" ? null : result;
  if (!detail)
    return pageMetadata({
      title: "Choose your collection",
      description:
        "Please try browsing the Arka Tara collection again shortly.",
      path: `/collections/${encodeURIComponent(slug)}`,
      noindex: true,
    });
  const page = detail.pagination.page;
  const filtered = Object.keys(query).some((key) => key !== "page");
  return pageMetadata({
    title: `${detail.page.seo_title || detail.page.title}${page > 1 ? ` — Page ${page}` : ""}`,
    description: detail.page.seo_description || detail.page.description,
    path: `${detail.page.path}${page > 1 && !filtered ? `?page=${page}` : ""}`,
    noindex: filtered,
  });
}

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps) {
  const query = await searchParams;
  const result = await collectionFor((await params).slug, query);
  const detail = result === "invalid-selection" ? null : result;
  if (!detail)
    return (
      <main id="main-content" className="page-shell">
        <h1 className="unavailable-heading">The collection.</h1>
        <CatalogueUnavailable invalidSelection />
      </main>
    );
  return (
    <main id="main-content" className="catalogue-page page-shell">
      <Breadcrumbs items={detail.breadcrumbs} query={query} />
      <header className="page-heading">
        <p className="eyebrow">THE ARKA TARA COLLECTION</p>
        <h1>{detail.page.title}</h1>
        <p>{detail.page.description}</p>
      </header>
      <CatalogueSelectors
        catalogue={detail}
        action={
          detail.page.kind === "MATERIAL" ? "/collections" : detail.page.path
        }
      />
      <section
        className="catalogue-products"
        aria-label={`${detail.page.title} pieces`}
      >
        <ProductCards products={detail.products} query={query} />
        <Pagination catalogue={detail} path={detail.page.path} query={query} />
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(breadcrumbSchema(detail.breadcrumbs)),
        }}
      />
    </main>
  );
}
