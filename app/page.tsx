const sampleFoods = [
  { name: "Banane", detail: "150 g", energy: "135 kcal", magnesium: "42 mg", potassium: "480 mg" },
  { name: "Amandes", detail: "30 g", energy: "190 kcal", magnesium: "70 mg", potassium: "200 mg" },
  { name: "Saumon", detail: "120 g", energy: "246 kcal", magnesium: "35 mg", potassium: "461 mg" }
];

const features = [
  {
    title: "Explorer CIQUAL",
    text: "Trouver rapidement un aliment, son groupe, ses nutriments clés et ses valeurs par portion."
  },
  {
    title: "Profil santé",
    text: "Entrer âge, taille, poids, sexe et activité pour calculer IMC, métabolisme et besoins estimés."
  },
  {
    title: "Gap nutritionnel",
    text: "Comparer les apports aux VNR UE, puis afficher ce qui reste à couvrir par l’alimentation."
  },
  {
    title: "Traçabilité",
    text: "Conserver la source, la version et la logique de calcul pour chaque valeur affichée."
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
          <p className="eyebrow">CIQUAL 2025 · VNR UE · Profil</p>
          <h1>Le copilote nutritionnel clair, sourcé et actionnable.</h1>
          <p className="lead">
            Rechercher un aliment, convertir les valeurs CIQUAL par portion, comparer aux repères réglementaires,
            puis décider quoi couvrir par l’alimentation avant tout complément.
          </p>
          <div className="ctaRow">
            <a className="primaryCta" href="/search">Rechercher un aliment</a>
            <a className="secondaryCta" href="/profil">Calculer mon profil</a>
          </div>
          <p className="microcopy">Version GitHub-first : le site reste visible sur Vercel, sans dépendance critique à Neon.</p>
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
            <p>Priorité : aliments denses, portions réalistes, complément seulement si nécessaire.</p>
          </div>
        </aside>
      </section>

      <section id="explorer" className="pageSection split">
        <div>
          <p className="eyebrow">Produit</p>
          <h2>Un outil consommateur, pas une simple vitrine.</h2>
          <p>
            NutriAtlas doit rester simple à comprendre : une recherche, une portion, un profil,
            un score et des explications lisibles.
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
            Le calcul part des VNR pour l’aspect réglementaire, puis complète par profil lorsque les
            données d’entrée sont disponibles : âge, sexe, taille, poids, activité et objectif.
          </p>
        </div>
        <div className="formula">
          <code>apport = valeur CIQUAL x portion / 100</code>
          <code>couverture = apport / référence</code>
          <code>reste = référence - apport alimentaire</code>
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
          <p>Âge, sexe, taille, poids et activité pour personnaliser les estimations.</p>
        </article>
      </section>
    </main>
  );
}
