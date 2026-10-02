import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter, SiteHeader } from "@/components/storefront";
import { jsonLd, organizationSchema, websiteSchema } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://arkatara.in"),
  title: {
    default: "Arka Tara | Jewellery, considered at home",
    template: "%s | Arka Tara",
  },
  description:
    "Order many. Try them at home. Buy any. Discover Arka Tara's assisted jewellery home-trial experience.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema()) }}
        />
      </body>
    </html>
  );
}
