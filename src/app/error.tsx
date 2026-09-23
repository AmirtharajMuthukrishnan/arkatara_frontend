"use client";

export default function PageError({ reset }: { reset: () => void }) {
  return (
    <main className="home">
      <section className="hero" aria-labelledby="error-title">
        <p className="eyebrow">ARKA TARA</p>
        <h1 id="error-title">This page could not load.</h1>
        <p className="intro">Please try again in a moment.</p>
        <button className="retry-button" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
