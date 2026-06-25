export default function HomePage() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/profil">Profil</a>
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
        </div>
      </nav>

      <section className="hero pageSection">
        <div className="heroCopy">
          <p className="eyebrow">Nutrition de précision</p>
          <h1>Définir son profil. Comprendre chaque aliment.</h1>
          <p className="lead">
            NutriAtlas commence par l’âge, le sexe, la taille, le poids et l’activité pour relier les aliments aux références nutritionnelles adaptées.
          </p>
          <div className="ctaRow">
            <a className="primaryCta" href="/profil">Définir mon profil</a>
            <a className="secondaryCta" href="/search">Rechercher un aliment</a>
          </div>
        </div>

        <aside className="heroPanel">
          <div className="panelHeader">
            <span>Aperçu</span>
            <strong>NutriAtlas</strong>
          </div>
          <div className="foodRow">
            <div>
              <strong>Profil d’abord</strong>
              <span>Âge, sexe, taille, poids, activité</span>
            </div>
          </div>
          <div className="foodRow">
            <div>
              <strong>Références ANSES</strong>
              <span>Repères personnalisés et sources visibles</span>
            </div>
          </div>
          <div className="gapCard">
            <span>Priorité</span>
            <strong>Dépassements lisibles</strong>
            <p>Les barres distinguent désormais objectif atteint, dépassement utile et dépassement à limiter.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
