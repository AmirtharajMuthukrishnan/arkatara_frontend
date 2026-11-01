import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type {
  Catalogue,
  Detail,
  ProductSummary,
  Reference,
} from "../lib/storefront";
import {
  Breadcrumbs,
  CatalogueSelectors,
  CatalogueUnavailable,
  CollectionLinks,
  Pagination,
  ProductCards,
  ProductDetail,
  SiteFooter,
  TrialFaq,
} from "./storefront";

afterEach(cleanup);

// Fictional display scenarios only; no operating locations or products are seeded.
const market: Reference = {
  id: "market-fixture",
  code: "TEST_CITY",
  name: "Example City",
  status: "ACTIVE",
};
const futureMarket: Reference = {
  id: "future-market-fixture",
  code: "NEXT_CITY",
  name: "Future City",
  status: "COMING_SOON",
};
const material: Reference = {
  id: "material-fixture",
  code: "TEST_METAL",
  name: "Example Material",
  status: "ACTIVE",
};
const product: ProductSummary = {
  id: "page-fixture",
  kind: "PRODUCT",
  slug: "example-piece",
  path: "/products/example-piece",
  title: "Example Piece",
  description: "A fictional piece for display testing.",
  seo_title: "",
  seo_description: "",
  product_id: "product-fixture",
  material_names: [material.name],
  availability: { state: "UNAVAILABLE", bookable: false },
  price: { state: "UNCONFIGURED" },
  media: [],
};
const catalogue: Catalogue = {
  schema_version: 1,
  markets: [market, futureMarket],
  materials: [material],
  selected_market: market,
  selected_material: null,
  collections: [],
  products: [product],
  pagination: { page: 2, page_size: 12, total_items: 30, total_pages: 3 },
};
const detail: Detail = {
  ...catalogue,
  page: product,
  breadcrumbs: [
    { title: "Home", path: "/" },
    { title: product.title, path: product.path },
  ],
  product: {
    id: product.product_id,
    name: product.title,
    description: product.description,
    availability: { state: "AVAILABLE_AT_HUB", bookable: false },
    price: product.price,
    media: [],
    variants: [
      {
        id: "variant-fixture",
        sku: "TEST-ONLY-001",
        material,
        purity: null,
        size_label: "Example size",
        specification: { finish: "Example finish" },
        availability: product.availability,
      },
    ],
  },
};

describe("data-driven storefront controls", () => {
  it("submits accessible GET selections and disables coming-soon choices", () => {
    const { container } = render(<CatalogueSelectors catalogue={catalogue} />);
    expect(screen.getByLabelText("Your city")).toHaveValue("TEST_CITY");
    expect(
      screen.getByRole("option", { name: "Future City — coming soon" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Your material"), {
      target: { value: material.code },
    });
    const form = container.querySelector("form")!;
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/collections");
    expect(new FormData(form).get("material")).toBe(material.code);
    expect(container).not.toHaveTextContent("Bengaluru");
  });

  it("renders future market activation directly from the response", () => {
    render(
      <CatalogueSelectors
        catalogue={{
          ...catalogue,
          markets: [{ ...futureMarket, status: "ACTIVE" }],
          selected_market: { ...futureMarket, status: "ACTIVE" },
        }}
      />,
    );
    expect(screen.getByRole("option", { name: "Future City" })).toBeEnabled();
    expect(screen.getByLabelText("Your city")).toHaveValue("NEXT_CITY");
  });

  it("does not invent options when reference data is empty", () => {
    render(
      <CatalogueSelectors
        catalogue={{
          ...catalogue,
          markets: [],
          materials: [],
          selected_market: null,
        }}
      />,
    );
    expect(screen.getByLabelText("Your city")).toBeDisabled();
    expect(screen.getByLabelText("Your material")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Explore" })).toBeDisabled();
  });

  it("retains selected scope in crawlable pagination links", () => {
    render(
      <Pagination
        catalogue={catalogue}
        path="/collections/example"
        query={{ market: market.code }}
      />,
    );
    expect(screen.getByRole("link", { name: "← Previous" })).toHaveAttribute(
      "href",
      "/collections/example?market=TEST_CITY",
    );
    expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute(
      "href",
      "/collections/example?market=TEST_CITY&page=3",
    );
    expect(screen.getByText("Page 2 of 3")).toBeVisible();
  });
  it("does not invent query filters from selected backend defaults", () => {
    render(<Pagination catalogue={catalogue} path="/collections" />);
    expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute(
      "href",
      "/collections?page=3",
    );
  });
  it("preserves explicit scope in product links and breadcrumb navigation", () => {
    render(
      <>
        <ProductCards
          products={[product]}
          query={{ market: "NEXT_CITY", material: "TEST_METAL", page: "3" }}
        />
        <Breadcrumbs
          items={detail.breadcrumbs}
          query={{ market: "NEXT_CITY" }}
        />
      </>,
    );
    expect(screen.getByRole("link", { name: product.title })).toHaveAttribute(
      "href",
      `${product.path}?market=NEXT_CITY&material=TEST_METAL`,
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/?market=NEXT_CITY",
    );
  });
});

describe("truthful catalogue presentation", () => {
  it("shows backend availability without inventing prices or product photographs", () => {
    render(<ProductCards products={[product]} />);
    expect(screen.getByRole("link", { name: product.title })).toHaveAttribute(
      "href",
      product.path,
    );
    expect(screen.getByText("Unavailable in this city")).toBeVisible();
    expect(screen.getByText("Photograph coming soon")).toBeVisible();
    expect(
      screen.getByText(
        "Pricing will be available when this piece is ready for booking.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders factual variant details while keeping booking closed even with physical stock", () => {
    render(<ProductDetail detail={detail} />);
    expect(
      screen.getByRole("heading", { level: 1, name: product.title }),
    ).toBeVisible();
    expect(screen.getByText("At the selected city's hub")).toBeVisible();
    expect(screen.getByText("TEST-ONLY-001")).toBeVisible();
    expect(screen.queryByText("Example finish")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Home-trial booking will open here" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /add to cart/i }),
    ).not.toBeInTheDocument();
  });

  it("distinguishes a real empty collection from an outage", () => {
    const { rerender } = render(<CollectionLinks collections={[]} />);
    expect(screen.getByText("A collection in the making.")).toBeVisible();
    expect(
      screen.queryByText(/temporarily unavailable/),
    ).not.toBeInTheDocument();
    rerender(<CatalogueUnavailable />);
    expect(
      screen.getByText(/The collection is temporarily unavailable/),
    ).toBeVisible();
    expect(
      screen.queryByText("A collection in the making."),
    ).not.toBeInTheDocument();
  });

  it("uses real breadcrumbs and marks the current page", () => {
    render(<Breadcrumbs items={detail.breadcrumbs} />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText(product.title)).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.queryByRole("link", { name: product.title }),
    ).not.toBeInTheDocument();
  });

  it("keeps FAQ answers native and avoids invented deposit guarantees", () => {
    const { container } = render(<TrialFaq />);
    expect(container.querySelectorAll("details")).toHaveLength(5);
    expect(container).toHaveTextContent(
      "including any applicable deposit or charges",
    );
    expect(container).not.toHaveTextContent("free home trial");
    expect(container).not.toHaveTextContent("fully refundable");
  });

  it("does not create unreviewed legal or account links in the footer", () => {
    render(<SiteFooter />);
    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual(["/", "/collections", "/how-it-works", "https://arkatara.in"]);
  });
});
