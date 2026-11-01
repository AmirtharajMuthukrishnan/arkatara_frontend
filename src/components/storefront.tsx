import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

import type {
  Catalogue,
  CatalogueQuery,
  Detail,
  PageSummary,
  ProductSummary,
} from "@/lib/storefront";

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Arka Tara home">
        ARKA TARA
        <span className="brand-star" aria-hidden="true">
          ✳
        </span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/collections">The collection</Link>
        <Link href="/how-it-works">How it works</Link>
      </nav>
      <span className="header-note">Consider it at home.</span>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="brand" href="/">
          ARKA TARA
          <span className="brand-star" aria-hidden="true">
            ✳
          </span>
        </Link>
        <p>Order many. Try them at home. Buy any.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/collections">
          Explore the collection <Arrow diagonal />
        </Link>
        <Link href="/how-it-works">
          The home-trial experience <Arrow diagonal />
        </Link>
      </nav>
      <div className="footer-bottom">
        <span>Jewellery, considered.</span>
        <Link href="https://arkatara.in">arkatara.in</Link>
      </div>
    </footer>
  );
}

export function RingIllustration({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`ring-art${compact ? " ring-art-compact" : ""}`}
      aria-hidden="true"
    >
      <div className="art-halo" />
      <div className="art-orbit" />
      <div className="silver-form silver-form-back" />
      <div className="silver-form silver-form-front" />
      <span className="art-spark">✧</span>
      {!compact && (
        <>
          <span className="art-label">A STUDY IN FORM</span>
          <span className="art-number">01 / SILVER</span>
        </>
      )}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
  href,
  linkText,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {children && <p className="section-intro">{children}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {linkText} <Arrow />
        </Link>
      )}
    </div>
  );
}

// Reference activation changes the selector, never booking authority.
// Refs: BUSINESS_RULES.md R-07, R-09, R-10, R-13.
export function CatalogueSelectors({
  catalogue,
  action = "/collections",
}: {
  catalogue: Catalogue;
  action?: string;
}) {
  return (
    <form className="catalogue-selectors" action={action} method="get">
      <div className="selector-intro">
        <span className="eyebrow">YOUR COLLECTION</span>
        <p>A little closer to you.</p>
      </div>
      <div className="selector-field">
        <label htmlFor="market">Your city</label>
        <select
          id="market"
          name="market"
          defaultValue={catalogue.selected_market?.code ?? ""}
          disabled={catalogue.markets.length === 0}
        >
          <option value="">Choose a city</option>
          {catalogue.markets.map((market) => (
            <option
              key={market.id}
              value={market.code}
              disabled={market.status !== "ACTIVE"}
            >
              {market.name}
              {market.status !== "ACTIVE" ? " — coming soon" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="selector-field">
        <label htmlFor="material">Your material</label>
        <select
          id="material"
          name="material"
          defaultValue={catalogue.selected_material?.code ?? ""}
          disabled={catalogue.materials.length === 0}
        >
          <option value="">Choose a material</option>
          {catalogue.materials.map((material) => (
            <option
              key={material.id}
              value={material.code}
              disabled={material.status !== "ACTIVE"}
            >
              {material.name}
              {material.status !== "ACTIVE" ? " — coming soon" : ""}
            </option>
          ))}
        </select>
      </div>
      <button
        className="button button-wine"
        type="submit"
        disabled={
          catalogue.markets.length === 0 && catalogue.materials.length === 0
        }
      >
        Explore <Arrow />
      </button>
    </form>
  );
}

function scopedPath(path: string, query: CatalogueQuery, page?: number) {
  const params = new URLSearchParams();
  for (const key of ["market", "material"]) {
    const value = query[key];
    if (typeof value === "string" && value) params.set(key, value);
  }
  if (page && page > 1) params.set("page", String(page));
  return `${path}${params.size ? `?${params}` : ""}`;
}

export function CollectionLinks({
  collections,
  query = {},
}: {
  collections: PageSummary[];
  query?: CatalogueQuery;
}) {
  if (collections.length === 0) return <EmptyCollection kind="collections" />;
  return (
    <div className="collection-links">
      {collections.map((collection, index) => (
        <Link
          className="collection-link"
          href={scopedPath(collection.path, query)}
          key={collection.id}
        >
          <span className="collection-number">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>
            <h3>{collection.title}</h3>
            {collection.description && <p>{collection.description}</p>}
          </span>
          <Arrow diagonal />
        </Link>
      ))}
    </div>
  );
}

const availabilityLabels = {
  AVAILABLE_AT_HUB: "At the selected city's hub",
  UNAVAILABLE: "Unavailable in this city",
  COMING_SOON: "Coming soon",
  UNCONFIGURED: "Availability to be confirmed",
} as const;

export function Availability({
  state,
}: {
  state: keyof typeof availabilityLabels;
}) {
  return (
    <span className={`availability availability-${state.toLowerCase()}`}>
      <span aria-hidden="true" />
      {availabilityLabels[state]}
    </span>
  );
}

export function ProductCards({
  products,
  query = {},
}: {
  products: ProductSummary[];
  query?: CatalogueQuery;
}) {
  if (products.length === 0) return <EmptyCollection kind="pieces" />;
  return (
    <div className="product-grid">
      {products.map((product) => (
        <article className="product-card" key={product.id}>
          <Link
            href={scopedPath(product.path, query)}
            className="product-image-link"
            aria-label={`View ${product.title}`}
          >
            {product.media[0] ? (
              <Image
                src={product.media[0].url}
                alt={product.media[0].alt_text}
                width={product.media[0].width}
                height={product.media[0].height}
                sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 30vw"
              />
            ) : (
              <div className="product-image-placeholder">
                <span aria-hidden="true">✧</span>
                <p>Photograph coming soon</p>
              </div>
            )}
          </Link>
          <div className="product-card-content">
            <p className="eyebrow">
              {product.material_names.join(" · ") || "The collection"}
            </p>
            <h3>
              <Link href={scopedPath(product.path, query)}>
                {product.title} <Arrow diagonal />
              </Link>
            </h3>
            <Availability state={product.availability.state} />
            <p className="price-note">
              Pricing will be available when this piece is ready for booking.
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function EmptyCollection({ kind }: { kind: "collections" | "pieces" }) {
  return (
    <div className="empty-collection">
      <span className="empty-symbol" aria-hidden="true">
        ✧
      </span>
      <div>
        <h3>
          {kind === "collections"
            ? "A collection in the making."
            : "Something worth discovering takes shape."}
        </h3>
        <p>
          {kind === "collections"
            ? "Our collections will appear here as they become ready to explore."
            : "There are no pieces to show for this selection yet. Explore another selection or come back to see what's new."}
        </p>
      </div>
    </div>
  );
}

export function CatalogueUnavailable({
  compact = false,
  invalidSelection = false,
}: {
  compact?: boolean;
  invalidSelection?: boolean;
}) {
  return (
    <section
      className={`catalogue-unavailable${compact ? " compact" : ""}`}
      aria-labelledby="catalogue-unavailable-title"
    >
      <span className="empty-symbol" aria-hidden="true">
        ✧
      </span>
      <h2 id="catalogue-unavailable-title">
        {invalidSelection
          ? "Let’s find your collection."
          : "A little pause in browsing."}
      </h2>
      <p>
        {invalidSelection
          ? "Choose a valid city, material or collection page to continue browsing."
          : "The collection is temporarily unavailable. Please try again shortly."}
      </p>
      <Link
        className="text-link"
        href={invalidSelection ? "/collections" : "/how-it-works"}
      >
        {invalidSelection
          ? "Return to the collection"
          : "Explore the home-trial experience"}{" "}
        <Arrow />
      </Link>
    </section>
  );
}

export function Breadcrumbs({
  items,
  query = {},
}: {
  items: { title: string; path: string }[];
  query?: CatalogueQuery;
}) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={item.path}>
            {index === items.length - 1 ? (
              <span aria-current="page">{item.title}</span>
            ) : (
              <Link href={scopedPath(item.path, query)}>{item.title}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Pagination({
  catalogue,
  path,
  query = {},
}: {
  catalogue: Catalogue;
  path: string;
  query?: CatalogueQuery;
}) {
  const { page, total_pages: totalPages } = catalogue.pagination;
  if (totalPages < 2) return null;
  function pageLink(next: number) {
    return scopedPath(path, query, next);
  }
  return (
    <nav className="pagination" aria-label="Collection pagination">
      {page > 1 ? (
        <Link className="text-link" rel="prev" href={pageLink(page - 1)}>
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link className="text-link" rel="next" href={pageLink(page + 1)}>
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

const steps = [
  {
    title: "Discover what speaks to you.",
    text: "Explore the collection and find designs you'd like to see, feel and try for yourself.",
  },
  {
    title: "Bring the experience home.",
    text: "An Arka Tara team member accompanies your selection for an assisted home trial.",
  },
  {
    title: "Keep what feels like you.",
    text: "See the fit. Notice the details. Choose the pieces you want to make your own.",
  },
];

export function TrialSteps() {
  return (
    <ol className="trial-steps">
      {steps.map((step, index) => (
        <li key={step.title}>
          <span className="step-number">0{index + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function HomeTrialSection() {
  return (
    <section
      className="home-trial section-pad"
      aria-labelledby="home-trial-title"
    >
      <div className="trial-heading">
        <p className="eyebrow">A DIFFERENT WAY TO CHOOSE</p>
        <h2 id="home-trial-title">
          Your mirror.
          <br />
          Your moment.
        </h2>
        <p>
          A photograph starts the conversation. Trying a piece makes it
          personal.
        </p>
        <Link className="text-link" href="/how-it-works">
          Meet the home-trial experience <Arrow />
        </Link>
      </div>
      <TrialSteps />
    </section>
  );
}

const questions = [
  {
    question: "What is an Arka Tara home trial?",
    answer:
      "It's an assisted way to choose jewellery in your own space. Explore designs online, try your selection at home with an Arka Tara team member and buy the pieces you choose.",
  },
  {
    question: "Where will home trials begin?",
    answer:
      "We're beginning in Bengaluru. Availability will depend on your location and the pieces in your selected city's collection. Home-trial booking is not open on this site yet.",
  },
  {
    question: "What jewellery will I find?",
    answer:
      "Our initial collection focuses on Silver / S925 jewellery. Gold is part of our future plans. Explore the collection for the materials and details of individual pieces.",
  },
  {
    question: "Do I need an account to browse?",
    answer: "No. You can explore the collection without creating an account.",
  },
  {
    question: "Is there a deposit or a home-trial fee?",
    answer:
      "The booking details, including any applicable deposit or charges, will be shared before home-trial booking opens. No booking or payment is taken on this site yet.",
  },
];

export function TrialFaq() {
  return (
    <section className="faq-section section-pad" aria-labelledby="faq-title">
      <div>
        <p className="eyebrow">A FEW THINGS TO KNOW</p>
        <h2 id="faq-title">
          Thoughtful questions.
          <br />
          Clear answers.
        </h2>
      </div>
      <div className="faq-list">
        {questions.map(({ question, answer }) => (
          <details key={question}>
            <summary>
              {question}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// Catalogue stock and reference activation are not permission to book or price a sale.
// Refs: BUSINESS_RULES.md R-07, R-09; DECISIONS.md BD-04, BD-13.
export function ProductDetail({ detail }: { detail: Detail }) {
  const product = detail.product;
  if (!product) return null;
  return (
    <>
      <section className="product-detail">
        <div className="product-gallery">
          {product.media.length ? (
            product.media.map((media, index) => (
              <Image
                key={media.id}
                src={media.url}
                alt={media.alt_text}
                width={media.width}
                height={media.height}
                sizes="(max-width: 800px) 90vw, 55vw"
                loading={index === 0 ? "eager" : "lazy"}
              />
            ))
          ) : (
            <div className="product-image-placeholder detail-placeholder">
              <span aria-hidden="true">✧</span>
              <p>Photographs of this piece are coming soon.</p>
            </div>
          )}
        </div>
        <div className="product-information">
          <p className="eyebrow">THE ARKA TARA COLLECTION</p>
          <h1>{product.name}</h1>
          <p className="product-description">
            {detail.page.description || product.description}
          </p>
          <Availability state={product.availability.state} />
          <div className="booking-note">
            <p>
              Pricing will be available when this piece is ready for booking.
            </p>
            <button className="button button-wine" type="button" disabled>
              Home-trial booking will open here
            </button>
            <p className="small-note">
              Browse now. Booking and payments are not open yet.
            </p>
          </div>
          <Link className="text-link" href="/how-it-works">
            How the home trial works <Arrow />
          </Link>
        </div>
      </section>
      <section className="variant-section" aria-label="Piece details">
        <SectionHeading eyebrow="A CLOSER LOOK" title="The details" />
        <div className="variant-grid">
          {product.variants.map((variant) => (
            <article className="variant-card" key={variant.id}>
              <h3>
                {variant.material.name}
                {variant.purity ? ` / ${variant.purity.name}` : ""}
              </h3>
              <dl>
                <div>
                  <dt>Design / SKU</dt>
                  <dd>{variant.sku}</dd>
                </div>
                {variant.size_label && (
                  <div>
                    <dt>Size</dt>
                    <dd>{variant.size_label}</dd>
                  </div>
                )}
              </dl>
              <Availability state={variant.availability.state} />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
