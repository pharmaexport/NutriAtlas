export default function HomePage() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/profil">Profil</a>
          <a href="/reco">Reco profil</a>
          <a href="/longevite">Longévité</a>
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
        </div>
      </nav>

      <section className="hero pageSection">
        <div className="heroCopy">
          <p className="eyebrow">Nutrition de précision</p>
          <h1>Définir son profil. Comprendre chaque aliment.</h1>
          <p className="lead">
            NutriAtlas relie le profil, les habitudes de vie et les aliments aux références nutritionnelles et aux recommandations personnalisées.
          </p>
          <div className="ctaRow">
            <a className="primaryCta" href="/profil">Définir mon profil</a>
            <a className="secondaryCta" href="/longevite">Onglet longévité</a>
          </div>
        </div>

        <aside className="heroPanel">
          <div className="panelHeader">
            <span>Aperçu</span>
            <strong>NutriAtlas</strong>
          </div>
          <div className="foodRow"><div><strong>Profil d’abord</strong><span>Âge, sexe, taille, poids, activité</span></div></div>
          <div className="foodRow"><div><strong>Reco profil</strong><span>ANSES, OMS et NHS transformés en priorités</span></div></div>
          <div className="gapCard"><span>Nouveau</span><strong>Longévité</strong><p>Questionnaire, score, confiance et sources institutionnelles affichées.</p></div>
        </aside>
      </section>
    </main>
  );
}
