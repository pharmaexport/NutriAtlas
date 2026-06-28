export default function HomePage() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/profil">Profil</a>
          <a href="/reco">Reco</a>
          <a href="/longevite">Longévité</a>
          <a href="/ciqual2">Base</a>
          <a href="/cumul">Cumul</a>
        </div>
      </nav>
      <section className="hero pageSection">
        <div className="heroCopy">
          <h1>NutriAtlas</h1>
          <div className="ctaRow">
            <a className="primaryCta" href="/ciqual2">Accès base</a>
          </div>
        </div>
      </section>
    </main>
  );
}
