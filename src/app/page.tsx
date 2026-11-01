import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Arrow,
  CatalogueSelectors,
  CatalogueUnavailable,
  CollectionLinks,
  HomeTrialSection,
  ProductCards,
  RingIllustration,
  SectionHeading,
  TrialFaq,
} from "@/components/storefront";
import { pageMetadata } from "@/lib/seo";
import {
  loadCatalogue,
  StorefrontNotFoundError,
  StorefrontQueryError,
  StorefrontUnavailableError,
  type CatalogueQuery,
} from "@/lib/storefront-server";

const description =
  "Discover Arka Tara's jewellery home-trial experience, beginning with Silver / S925 in Bengaluru. Order many. Try them at home. Buy any.";

async function homeCatalogue(query: CatalogueQuery) {
  try {
    return await loadCatalogue(query);
  } catch (error) {
    if (error instanceof StorefrontNotFoundError) notFound();
    if (error instanceof StorefrontQueryError)
      return "invalid-selection" as const;
    if (error instanceof StorefrontUnavailableError) return null;
    throw error;
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CatalogueQuery>;
}) {
  const query = await searchParams;
  await homeCatalogue(query);
  return pageMetadata({
    title: "Arka Tara | Jewellery, considered at home",
    description,
    path: "/",
    noindex: Object.keys(query).length > 0,
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<CatalogueQuery>;
}) {
  const query = await searchParams;
  const result = await homeCatalogue(query);
  const catalogue = result === "invalid-selection" ? null : result;
  return (
    <main id="main-content">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-line" /> JEWELLERY, ON YOUR TERMS
          </p>
          <h1>
            Order many.
            <br />
            Try them at home.
            <br />
            <em>Buy any.</em>
          </h1>
          <p className="hero-intro">
            Some things are better discovered in person.
            <br />
            Find the jewellery that feels like you, at home.
          </p>
          <div className="hero-actions">
            <Link className="button button-wine" href="/collections">
              Explore the collection <Arrow />
            </Link>
            <Link className="text-link" href="/how-it-works">
              How it works <Arrow diagonal />
            </Link>
          </div>
          <p className="hero-footnote">
            Beginning with Silver / S925 in Bengaluru.
          </p>
        </div>
        <figure className="hero-art">
          <RingIllustration />
          <figcaption>
            An editorial illustration, not a product photograph.
          </figcaption>
        </figure>
      </section>
      <div className="brand-strip">
        <span>Discover the details.</span>
        <span aria-hidden="true">✳</span>
        <span>Try it in your own light.</span>
        <span aria-hidden="true">✳</span>
        <span>Choose what feels right.</span>
      </div>
      <section
        className="section-pad discover-section"
        aria-labelledby="discover-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2 id="discover-title">
              A detail. A feeling.
              <br />
              Something that&apos;s you.
            </h2>
          </div>
          <p className="section-aside">
            Thoughtfully chosen jewellery.
            <br />
            Space to make it your own.
          </p>
        </div>
        {catalogue ? (
          <>
            <CatalogueSelectors catalogue={catalogue} />
            <CollectionLinks
              collections={catalogue.collections}
              query={query}
            />
          </>
        ) : (
          <CatalogueUnavailable
            compact
            invalidSelection={result === "invalid-selection"}
          />
        )}
      </section>
      <HomeTrialSection />
      {catalogue && (
        <section className="section-pad">
          <SectionHeading
            eyebrow="EXPLORE THE PIECES"
            title="Find your next everyday detail."
            href="/collections"
            linkText="View the collection"
          />
          <ProductCards
            products={catalogue.products.slice(0, 4)}
            query={query}
          />
        </section>
      )}
      <section
        className="values-strip section-pad"
        aria-label="The Arka Tara experience"
      >
        <div>
          <span aria-hidden="true">01</span>
          <h2>A human touch.</h2>
          <p>An attended home trial with an Arka Tara team member.</p>
        </div>
        <div>
          <span aria-hidden="true">02</span>
          <h2>Room to discover.</h2>
          <p>Feel the fit, see the detail and explore what suits you.</p>
        </div>
        <div>
          <span aria-hidden="true">03</span>
          <h2>Your choice, always.</h2>
          <p>Try your selection. Buy only the pieces you choose.</p>
        </div>
      </section>
      <TrialFaq />
      <section className="closing-note">
        <p className="eyebrow">MAKE YOURSELF AT HOME</p>
        <h2>
          Good jewellery.
          <br />
          <em>A more personal way to choose.</em>
        </h2>
        <Link className="button button-outline" href="/collections">
          Meet the collection <Arrow />
        </Link>
      </section>
    </main>
  );
}
