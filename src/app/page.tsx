export default function HomePage() {
  return (
    <main className="home">
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">ARKA TARA</p>
        <h1 id="hero-title">Order many. Try them at home. Buy any.</h1>
        <p className="intro">
          A modern jewellery experience, beginning in Bengaluru with Silver.
        </p>
        <div className="availability" aria-label="Launch availability">
          <span>Silver · Available</span>
          <span>Gold · Coming soon</span>
        </div>
      </section>
    </main>
  );
}
