export default function HomePage() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/search">Recherche</a>
          <a href="/profil">Profil</a>
        </div>
      </nav>

      <section className="hero pageSection">
        <div className="heroCopy">
          <p className="eyebrow">Nutrition de precision</p>
          <h1>Comprendre chaque aliment. Mieux nourrir votre corps.</h1>
          <p className="lead">
            NutriAtlas aide a rechercher un aliment, comprendre ses apports et preparer un profil nutritionnel personnel.
          </p>
          <div className="ctaRow">
            <a className="primaryCta" href="/search">Rechercher un aliment</a>
            <a className="secondaryCta" href="/profil">Mon profil</a>
          </div>
        </div>

        <aside className="heroPanel">
          <div className="panelHeader">
            <span>Apercu</span>
            <strong>NutriAtlas</strong>
          </div>
          <div className="foodRow">
            <div>
              <strong>Recherche intelligente</strong>
              <span>Suggestions alimentaires</span>
            </div>
          </div>
          <div className="foodRow">
            <div>
              <strong>Analyse par portion</strong>
              <span>Apports utiles et lisibles</span>
            </div>
          </div>
          <div className="gapCard">
            <span>Priorite</span>
            <strong>Base stable</strong>
            <p>Le site reste visible pendant que l index complet est prepare proprement.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
