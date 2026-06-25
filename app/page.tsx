export default function HomePage() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
          <a href="/profil">Profil</a>
          <a href="/#sources">Sources</a>
        </div>
      </nav>

      <section className="hero pageSection">
        <div className="heroCopy">
          <p className="eyebrow">Nutrition de précision</p>
          <h1>Comprendre chaque aliment. Mieux nourrir votre corps.</h1>
          <p className="lead">
            NutriAtlas aide à rechercher un aliment, comprendre ses apports par portion et préparer un profil nutritionnel personnel.
          </p>
          <div className="ctaRow">
            <a className="primaryCta" href="/search">Rechercher un aliment</a>
            <a className="secondaryCta" href="/profil">Mon profil</a>
          </div>
        </div>

        <aside className="heroPanel">
          <div className="panelHeader">
            <span>Aperçu</span>
            <strong>NutriAtlas</strong>
          </div>
          <div className="foodRow">
            <div>
              <strong>Recherche intelligente</strong>
              <span>Suggestions alimentaires issues de CIQUAL</span>
            </div>
          </div>
          <div className="foodRow">
            <div>
              <strong>Analyse par portion</strong>
              <span>Apports utiles et points à surveiller</span>
            </div>
          </div>
          <div className="gapCard">
            <span>Priorité</span>
            <strong>CIQUAL 2025</strong>
            <p>L’index applicatif est généré depuis la table CIQUAL placée dans le dépôt.</p>
          </div>
        </aside>
      </section>

      <section id="sources" className="pageSection profileFormPreview">
        <div>
          <p className="eyebrow">Sources et transparence</p>
          <h2>Base de référence nutritionnelle.</h2>
          <p>
            NutriAtlas utilise la table CIQUAL 2025 fournie par l’ANSES comme source locale unique.
            Le fichier source est transformé en index applicatif reproductible au build.
          </p>
        </div>
        <div className="scenarioGrid">
          <article>
            <strong>Source</strong>
            <span>CIQUAL 2025 – ANSES.</span>
          </article>
          <article>
            <strong>Méthode</strong>
            <span>Table source, génération contrôlée, index traité versionné.</span>
          </article>
          <article>
            <strong>Limite</strong>
            <span>Score indicatif non médical, utile pour comparer des portions.</span>
          </article>
        </div>
      </section>
    </main>
  );
}
