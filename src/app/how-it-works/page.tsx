import Link from "next/link";
import {
  Arrow,
  Breadcrumbs,
  RingIllustration,
  TrialFaq,
  TrialSteps,
} from "@/components/storefront";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "The jewellery home-trial experience",
  description:
    "Discover how Arka Tara's assisted home trial brings jewellery to your own space. Explore designs, try them at home and choose what feels like you.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <main id="main-content">
      <div className="page-shell">
        <Breadcrumbs
          items={[
            { title: "Home", path: "/" },
            { title: "How it works", path: "/how-it-works" },
          ]}
        />
        <section className="experience-hero">
          <header className="page-heading">
            <p className="eyebrow">THE HOME-TRIAL EXPERIENCE</p>
            <h1>
              Jewellery is personal.
              <br />
              <em>Choosing it should be, too.</em>
            </h1>
            <p>
              Your favourite corner. Your own mirror. A chance to see how a
              piece feels before deciding to make it yours.
            </p>
            <Link className="button button-wine" href="/collections">
              Explore the collection <Arrow />
            </Link>
          </header>
          <div className="experience-art">
            <RingIllustration compact />
            <p>Editorial illustration</p>
          </div>
        </section>
        <section
          className="experience-steps"
          aria-labelledby="experience-title"
        >
          <p className="eyebrow">ORDER MANY. TRY THEM AT HOME. BUY ANY.</p>
          <h2 id="experience-title">
            From a first look to a personal favourite.
          </h2>
          <TrialSteps />
        </section>
        <aside className="booking-readiness">
          <span aria-hidden="true">✳</span>
          <div>
            <h2>A note before you explore.</h2>
            <p>
              Our home-trial experience begins in Bengaluru with Silver / S925
              jewellery. You can explore the collection now; booking is not open
              yet. Service areas, visit details and any applicable charges will
              be shared before bookings open.
            </p>
          </div>
        </aside>
      </div>
      <TrialFaq />
    </main>
  );
}
