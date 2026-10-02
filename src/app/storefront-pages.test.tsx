import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Catalogue, Detail, PageSummary } from "../lib/storefront";
import {
  loadCatalogue,
  loadCataloguePage,
  StorefrontNotFoundError,
  StorefrontQueryError,
  StorefrontUnavailableError,
} from "../lib/storefront-server";
import HomePage, { generateMetadata as homeMetadata } from "./page";
import CollectionsPage, {
  generateMetadata as collectionsMetadata,
} from "./collections/page";
import CollectionPage, {
  generateMetadata as collectionMetadata,
} from "./collections/[slug]/page";
import ProductPage, {
  generateMetadata as productMetadata,
} from "./products/[slug]/page";
import HowItWorksPage from "./how-it-works/page";

vi.mock("../lib/storefront-server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/storefront-server")>()),
  loadCatalogue: vi.fn(),
  loadCataloguePage: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

// Fictional content proves rendering without creating public catalogue fixtures.
const catalogue: Catalogue = {
  schema_version: 1,
  markets: [],
  materials: [],
  selected_market: null,
  selected_material: null,
  collections: [],
  products: [],
  pagination: { page: 1, page_size: 12, total_items: 0, total_pages: 1 },
};
const page: PageSummary = {
  id: "test-page",
  kind: "CATEGORY",
  slug: "example-collection",
  path: "/collections/example-collection",
  title: "Example collection",
  description: "A fictional collection for tests.",
  seo_title: "Example collection for browsing",
  seo_description: "Fictional reviewed descriptive text.",
};
const detail: Detail = {
  ...catalogue,
  page,
  breadcrumbs: [
    { title: "Home", path: "/" },
    { title: "The collection", path: "/collections" },
    { title: page.title, path: page.path },
  ],
  product: null,
};
const product: Detail = {
  ...detail,
  page: {
    ...page,
    kind: "PRODUCT",
    slug: "example-piece",
    path: "/products/example-piece",
    title: "Example piece",
    seo_title: "Example piece | Jewellery",
  },
  product: {
    id: "test-product",
    name: "Example piece",
    description: "A fictional product for tests.",
    variants: [],
    availability: { state: "UNCONFIGURED", bookable: false },
    price: { state: "UNCONFIGURED" },
    media: [],
  },
};

beforeEach(() => {
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  vi.mocked(loadCatalogue).mockResolvedValue(catalogue);
  vi.mocked(loadCataloguePage).mockResolvedValue(detail);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("server-rendered public routes", () => {
  it("renders useful home content with one main heading before client hydration", async () => {
    const { container } = render(
      await HomePage({ searchParams: Promise.resolve({}) }),
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Order many.Try them at home.Buy any.",
    );
    expect(screen.getByText("A collection in the making.")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Explore the collection" }),
    ).toHaveAttribute("href", "/collections");
    expect(container).toHaveTextContent("not a product photograph");
    expect(container).not.toHaveTextContent("₹");
    expect(container.querySelector("main")).toHaveAttribute(
      "id",
      "main-content",
    );
  });

  it("renders a factual experience page without opening booking", () => {
    render(<HowItWorksPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByText(
        /You can explore the collection now; booking is not open yet/,
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /book/i }),
    ).not.toBeInTheDocument();
  });

  it("gives meaningful pagination its own canonical and keeps filter variants noindex", async () => {
    vi.mocked(loadCatalogue).mockResolvedValue({
      ...catalogue,
      pagination: { page: 2, page_size: 12, total_items: 20, total_pages: 2 },
    });
    const metadata = await collectionsMetadata({
      searchParams: Promise.resolve({ page: "2" }),
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://arkatara.in/collections?page=2",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    const filtered = await collectionsMetadata({
      searchParams: Promise.resolve({ page: "2", market: "TEST" }),
    });
    expect(filtered.alternates?.canonical).toBe(
      "https://arkatara.in/collections",
    );
    expect(filtered.robots).toEqual({ index: false, follow: true });
  });

  it("renders category text, metadata and matching breadcrumb schema from public data", async () => {
    const { container } = render(
      await CollectionPage({
        params: Promise.resolve({ slug: page.slug }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: page.title }),
    ).toBeVisible();
    expect(screen.getByText(page.description)).toBeVisible();
    const schema = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!
        .textContent!,
    );
    expect(schema.itemListElement.at(-1).item).toBe(
      `https://arkatara.in${page.path}`,
    );
    const metadata = await collectionMetadata({
      params: Promise.resolve({ slug: page.slug }),
      searchParams: Promise.resolve({}),
    });
    expect(metadata.title).toBe(page.seo_title);
    expect(metadata.description).toBe(page.seo_description);
  });

  it("renders factual Product data without inferred offers or ratings", async () => {
    vi.mocked(loadCataloguePage).mockResolvedValue(product);
    const { container } = render(
      await ProductPage({
        params: Promise.resolve({ slug: product.page.slug }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      product.product!.name,
    );
    const schemas = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]'),
    ).map((script) => JSON.parse(script.textContent!));
    const schema = schemas.find((entry) => entry["@type"] === "Product");
    expect(schema.name).toBe(
      screen.getByRole("heading", { level: 1 }).textContent,
    );
    expect(schema.url).toBe(`https://arkatara.in${product.page.path}`);
    expect(schema).not.toHaveProperty("offers");
    expect(schema).not.toHaveProperty("aggregateRating");
    expect(schema).not.toHaveProperty("review");
  });

  it("does not paginate a product identity or propagate page query into product reads", async () => {
    vi.mocked(loadCataloguePage).mockResolvedValue(product);
    const metadata = await productMetadata({
      params: Promise.resolve({ slug: product.page.slug }),
      searchParams: Promise.resolve({ page: "2", market: "TEST" }),
    });
    expect(loadCataloguePage).toHaveBeenLastCalledWith(product.page.slug, {
      market: "TEST",
      page: undefined,
    });
    expect(metadata.alternates?.canonical).toBe(
      `https://arkatara.in${product.page.path}`,
    );
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});

describe("missing content and service failure remain different", () => {
  it("turns actual missing pages and wrong-kind routes into notFound", async () => {
    const props = {
      params: Promise.resolve({ slug: page.slug }),
      searchParams: Promise.resolve({}),
    };
    vi.mocked(loadCataloguePage).mockResolvedValue(null);
    await expect(CollectionPage(props)).rejects.toThrow("NEXT_NOT_FOUND");
    vi.mocked(loadCataloguePage).mockResolvedValue(detail);
    await expect(ProductPage(props)).rejects.toThrow("NEXT_NOT_FOUND");
    vi.mocked(loadCataloguePage).mockResolvedValue(product);
    await expect(CollectionPage(props)).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("treats nonexistent pagination as notFound", async () => {
    vi.mocked(loadCatalogue).mockRejectedValue(new StorefrontNotFoundError());
    await expect(
      CollectionsPage({ searchParams: Promise.resolve({ page: "999" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("propagates catalogue outages to the server error response instead of a false 404 or noindex success", async () => {
    vi.mocked(loadCataloguePage).mockRejectedValue(
      new StorefrontUnavailableError(),
    );
    const props = {
      params: Promise.resolve({ slug: product.page.slug }),
      searchParams: Promise.resolve({}),
    };
    await expect(ProductPage(props)).rejects.toBeInstanceOf(
      StorefrontUnavailableError,
    );
    await expect(productMetadata(props)).rejects.toBeInstanceOf(
      StorefrontUnavailableError,
    );
    await expect(CollectionPage(props)).rejects.toBeInstanceOf(
      StorefrontUnavailableError,
    );
    vi.mocked(loadCatalogue).mockRejectedValue(
      new StorefrontUnavailableError(),
    );
    await expect(
      CollectionsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toBeInstanceOf(StorefrontUnavailableError);
  });

  it("preserves meaningful home content and its normal indexing preference during a catalogue outage", async () => {
    vi.mocked(loadCatalogue).mockRejectedValue(
      new StorefrontUnavailableError(),
    );
    const props = { searchParams: Promise.resolve({}) };
    render(await HomePage(props));
    expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      screen.getByText(/The collection is temporarily unavailable/),
    ).toBeVisible();
    expect((await homeMetadata(props)).robots).toEqual({
      index: true,
      follow: true,
    });
  });

  it("offers selection recovery for invalid query input without claiming a service outage", async () => {
    vi.mocked(loadCataloguePage).mockRejectedValue(new StorefrontQueryError());
    const props = {
      params: Promise.resolve({ slug: product.page.slug }),
      searchParams: Promise.resolve({ market: ["ONE", "TWO"] }),
    };
    render(await ProductPage(props));
    expect(
      screen.getByText(
        "Choose a valid city, material or collection page to continue browsing.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Return to the collection" }),
    ).toHaveAttribute("href", "/collections");
    expect(
      screen.queryByText(/temporarily unavailable/),
    ).not.toBeInTheDocument();
    expect((await productMetadata(props)).robots).toEqual({
      index: false,
      follow: true,
    });
  });

  it("canonicalizes filtered pagination to the existing collection base and lets a new material selection explore another collection", async () => {
    vi.mocked(loadCataloguePage).mockResolvedValue({
      ...detail,
      page: { ...detail.page, kind: "MATERIAL" },
      pagination: { page: 3, page_size: 12, total_items: 30, total_pages: 3 },
    });
    const props = {
      params: Promise.resolve({ slug: page.slug }),
      searchParams: Promise.resolve({ material: "TEST", page: "3" }),
    };
    const metadata = await collectionMetadata(props);
    expect(metadata.alternates?.canonical).toBe(
      `https://arkatara.in${page.path}`,
    );
    expect(metadata.robots).toEqual({ index: false, follow: true });
    const { container } = render(await CollectionPage(props));
    expect(container.querySelector("form")).toHaveAttribute(
      "action",
      "/collections",
    );
  });
});
