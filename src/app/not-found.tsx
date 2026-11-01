import Link from "next/link";
import { Arrow } from "@/components/storefront";

export default function NotFound() {
  return (
    <main id="main-content" className="not-found-page">
      <p className="eyebrow">404 / A LITTLE OFF THE PATH</p>
      <span className="empty-symbol" aria-hidden="true">
        ✧
      </span>
      <h1>This page isn&apos;t here.</h1>
      <p>
        The piece or page you&apos;re looking for may have moved or is no longer
        available.
      </p>
      <Link className="button button-wine" href="/collections">
        Return to the collection <Arrow />
      </Link>
      <Link className="text-link" href="/">
        Back to Arka Tara home
      </Link>
    </main>
  );
}
