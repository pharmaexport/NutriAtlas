const sampleFoods = [
  { name: "Banane", detail: "150 g", energy: "135 kcal", magnesium: "41 mg", potassium: "538 mg" },
  { name: "Amandes", detail: "30 g", energy: "190 kcal", magnesium: "77 mg", potassium: "220 mg" },
  { name: "Saumon", detail: "120 g", energy: "247 kcal", magnesium: "34 mg", potassium: "490 mg" }
];

const features = [
  {
    title: "Recherche alimentaire",
    text: "Explorer les aliments CIQUAL par nom, groupe, nutriment ou densité nutritionnelle."
  },
  {
    title: "Calcul par portion",
    text: "Convertir les valeurs pour 100 g en apports réels selon les portions saisies."
  },
  {
    title: "Gap nutritionnel",
    text: "Comparer les apports aux VNR UE puis aux références profil quand elles sont disponibles."
  },
  {
    title: "Traçabilité",
    text: "Afficher la source, la version, le checksum et la citation pour chaque valeur."
  }
];

export default function HomePage() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top">NutriAtlas</a>
        <div className="navLinks">
          <a href="#explorer">Explorer</a>
          <a href="#gap">Gap nutritionnel</a>
          <a href="#sources">Sources</a>
        </div>
      </nav>

      <section id="top" className="hero pageSection">
        <div className="heroCopy">
          <p className="eyebrow">CIQUAL 2025 · VNR UE · ANSES</p>
          <h1>Le moteur nutritionnel sourcé, traçable et réglementaire.</h1>
          <p className="lead">
            Rechercher un aliment, calculer ses apports par portion, comparer aux VNR,
            puis identifier ce qui reste à couvrir par l’alimentation avant tout complément.
          </p>
          <div className="searchBox" role="search">
            <span>🔎</span>
            <input aria-label="Recherche aliment" placeholder="Essayez : banane, amandes, saumon..." />
            <button>Rechercher</button>
          </div>
          <p className="microcopy">Prototype public : les calculs dynamiques seront branchés après l’import CIQUAL.</p>
        </div>

        <aside className="heroPanel" aria-label="Aperçu nutritionnel">
          <div className="panelHeader">
            <span>Portions du jour</span>
            <strong>Démo</strong>
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
            <span>Gap magnésium estimé</span>
            <strong>223 mg restants</strong>
            <p>À couvrir d’abord par des aliments. Équivalent complément : théorique uniquement.</p>
          </div>
        </aside>
      </section>

      <section id="explorer" className="pageSection split">
        <div>
          <p className="eyebrow">Produit</p>
          <h2>Un vrai outil, pas seulement une page vitrine.</h2>
          <p>
            NutriAtlas doit devenir une interface de consultation et de calcul : aliments,
            nutriments, portions, comparaisons et références réglementaires.
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
          <p className="eyebrow">Fonction clé</p>
          <h2>Complément nécessaire vs portions alimentaires spécifiques.</h2>
          <p>
            Le calcul part des portions alimentaires, applique CIQUAL, compare aux VNR UE,
            puis ajuste par profil lorsque les références officielles sont intégrées.
          </p>
        </div>
        <div className="formula">
          <code>apport = valeur_CIQUAL × portion_g / 100</code>
          <code>gap = cible_référence − apport</code>
          <code>complément = gap / dose_produit</code>
        </div>
      </section>

      <section id="sources" className="pageSection sourceGrid">
        <article>
          <span>01</span>
          <h3>CIQUAL 2025</h3>
          <p>Source maître pour la composition nutritionnelle des aliments.</p>
        </article>
        <article>
          <span>02</span>
          <h3>VNR UE</h3>
          <p>Socle réglementaire pour les pourcentages de référence et les compléments.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Profil</h3>
          <p>Âge, sexe, grossesse et allaitement pour compléter avec ANSES/EFSA.</p>
        </article>
      </section>
    </main>
  );
}
