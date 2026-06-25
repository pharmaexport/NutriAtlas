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
              <span>Suggestions alimentaires normalisées</span>
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
            <strong>Base stable</strong>
            <p>Le site reste visible pendant que l’index complet est préparé proprement.</p>
          </div>
        </aside>
      </section>

      <section id="sources" className="pageSection profileFormPreview">
        <div>
          <p className="eyebrow">Sources et transparence</p>
          <h2>Base de référence nutritionnelle.</h2>
          <p>
            La version actuelle utilise une base CIQUAL de prévisualisation stockée dans le dépôt.
            La base compressée sert de source de référence, puis génère le fichier traité utilisé par l’application.
          </p>
        </div>
        <div className="scenarioGrid">
          <article>
            <strong>Source</strong>
            <span>CIQUAL preview, à remplacer par l’import institutionnel complet.</span>
          </article>
          <article>
            <strong>Méthode</strong>
            <span>Données compressées, décompression contrôlée, index traité versionné.</span>
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
