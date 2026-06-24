const sampleFoods = [
  { name: "Banane", detail: "150 g", energy: "135 kcal", magnesium: "42 mg", potassium: "480 mg" },
  { name: "Amandes", detail: "30 g", energy: "190 kcal", magnesium: "70 mg", potassium: "200 mg" },
  { name: "Saumon", detail: "120 g", energy: "246 kcal", magnesium: "35 mg", potassium: "461 mg" }
];

const features = [
  {
    title: "Recherche intelligente",
    text: "Suggestions instantanees, noms alimentaires normalises et selection rapide du bon aliment."
  },
  {
    title: "Profil metabolique",
    text: "IMC, besoins energetiques, activite et objectifs pour personnaliser les estimations."
  },
  {
    title: "Priorites nutritionnelles",
    text: "Identifier les apports couverts, les manques probables et les aliments les plus pertinents."
  },
  {
    title: "Precision exploitable",
    text: "Transformer des donnees nutritionnelles techniques en decisions simples, lisibles et actionnables."
  }
];

export default function HomePage() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top">NutriAtlas</a>
        <div className="navLinks">
          <a href="/search">Recherche</a>
          <a href="/profil">Profil</a>
          <a href="#sources">Sources</a>
        </div>
      </nav>

      <section id="top" className="hero pageSection">
        <div className="heroCopy">
          <p className="eyebrow">Nutrition de precision · Profil · Portions</p>
          <h1>Le moteur nutritionnel personnel, clair et actionnable.</h1>
          <p className="lead">
            Rechercher un aliment, choisir la bonne portion, comprendre les apports reels et prioriser ce qui merite vraiment d etre ajuste.
          </p>
          <div className="ctaRow">
            <a className="primaryCta" href="/search">Rechercher un aliment</a>
            <a className="secondaryCta" href="/profil">Calculer mon profil</a>
          </div>
          <p className="microcopy">Une experience concue pour passer de la donnée nutritionnelle brute a une decision simple.</p>
        </div>

        <aside className="heroPanel" aria-label="Apercu nutritionnel">
          <div className="panelHeader">
            <span>Portions du jour</span>
            <strong>Apercu</strong>
          </div>
          {sampleFoods.map((food) => (
            <div className="foodRow" key={food.name}>
              <div>
                <strong>{food.name}</strong>
                <span>{food.detail}</span>
              </div>
              <div className="nutrients">
                <span>{food.energy}</span>
                <span>Mg {food.magnesium}</span>
                <span>K {food.potassium}</span>
              </div>
            </div>
          ))}
          <div className="gapCard">
            <span>Priorite estimee</span>
            <strong>Magnesium</strong>
            <p>Identifier les aliments les plus denses avant d envisager une correction supplementaire.</p>
          </div>
        </aside>
      </section>

      <section id="explorer" className="pageSection split">
        <div>
          <p className="eyebrow">Positionnement</p>
          <h2>Une interface premium pour comprendre son alimentation sans devenir expert.</h2>
          <p>
            NutriAtlas combine recherche alimentaire, calcul par portion, profil personnel et priorisation nutritionnelle dans une experience directe.
          </p>
        </div>
        <div className="featureGrid">
          {features.map((feature) => (
            <article className="feature" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="gap" className="pageSection calculatorPreview">
        <div>
          <p className="eyebrow">Methode</p>
          <h2>Des apports par portion aux priorites concretes.</h2>
          <p>
            Les valeurs nutritionnelles deviennent utiles lorsqu elles sont reliees a une portion consommee,
            a un profil personnel et a un objectif clair.
          </p>
        </div>
        <div className="formula">
          <code>portion consommee → apports reels</code>
          <code>profil personnel → besoins estimes</code>
          <code>ecart nutritionnel → priorites alimentaires</code>
        </div>
      </section>

      <section id="sources" className="pageSection sourceGrid">
        <article>
          <span>01</span>
          <h3>Aliments</h3>
          <p>Recherche rapide, libelles normalises et valeurs par portion.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Profil</h3>
          <p>Age, taille, poids, activite et objectif pour personnaliser les estimations.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Priorites</h3>
          <p>Une lecture simple des apports, des manques possibles et des meilleurs leviers alimentaires.</p>
        </article>
      </section>
    </main>
  );
}
