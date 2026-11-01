import { notFound } from "next/navigation";
import {
  Breadcrumbs,
  CatalogueSelectors,
  CatalogueUnavailable,
  CollectionLinks,
  Pagination,
  ProductCards,
  SectionHeading,
} from "@/components/storefront";
import { pageMetadata } from "@/lib/seo";
import {
  loadCatalogue,
  StorefrontNotFoundError,
  StorefrontQueryError,
  type CatalogueQuery,
} from "@/lib/storefront-server";

const description =
  "Explore the Arka Tara jewellery collection. Discover designs, materials and details, with availability for your selected city.";

async function catalogueFor(query: CatalogueQuery) {
  try {
    return await loadCatalogue(query);
  } catch (error) {
    if (error instanceof StorefrontNotFoundError) notFound();
    if (error instanceof StorefrontQueryError)
      return "invalid-selection" as const;
    throw error;
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CatalogueQuery>;
}) {
  const query = await searchParams;
  const result = await catalogueFor(query);
  const catalogue = result === "invalid-selection" ? null : result;
  const page = catalogue?.pagination.page ?? 1;
  const filtered = Object.keys(query).some((key) => key !== "page");
  return pageMetadata({
    title: page > 1 ? `The collection — Page ${page}` : "The collection",
    description,
    path: `/collections${page > 1 && !filtered ? `?page=${page}` : ""}`,
    noindex: !catalogue || filtered,
  });
}

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogueQuery>;
}) {
  const query = await searchParams;
  const result = await catalogueFor(query);
  const catalogue = result === "invalid-selection" ? null : result;
  return (
    <main id="main-content" className="catalogue-page page-shell">
      <Breadcrumbs
        query={query}
        items={[
          { title: "Home", path: "/" },
          { title: "The collection", path: "/collections" },
        ]}
      />
      <header className="page-heading">
        <p className="eyebrow">JEWELLERY, CONSIDERED</p>
        <h1>The collection.</h1>
        <p>
          Find a detail that speaks to you. Then get to know it a little better.
        </p>
      </header>
      {catalogue ? (
        <>
          <CatalogueSelectors catalogue={catalogue} />
          <section
            className="browse-categories"
            aria-label="Browse collections"
          >
            <CollectionLinks
              collections={catalogue.collections}
              query={query}
            />
          </section>
          <section className="catalogue-products" aria-label="Jewellery pieces">
            <SectionHeading
              eyebrow="A CLOSER LOOK"
              title="Discover the pieces."
            />
            <ProductCards products={catalogue.products} query={query} />
            <Pagination
              catalogue={catalogue}
              path="/collections"
              query={query}
            />
          </section>
        </>
      ) : (
        <CatalogueUnavailable invalidSelection />
      )}
    </main>
  );
}
