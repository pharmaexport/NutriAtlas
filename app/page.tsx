const pillars = [
  "CIQUAL 2025 comme source nutritionnelle maître",
  "VNR UE pour le socle réglementaire",
  "Références profil ANSES/EFSA à venir",
  "Traçabilité complète des données"
];

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">NutriAtlas</p>
        <h1>Explorer la nutrition à partir de données officielles.</h1>
        <p className="lead">
          NutriAtlas est un moteur de recherche nutritionnel fondé sur CIQUAL,
          ANSES, les VNR réglementaires et des références traçables.
        </p>
        <div className="actions">
          <a href="https://github.com/pharmaexport/NutriAtlas">Voir le repository</a>
          <a href="/docs" aria-disabled="true">Documentation à venir</a>
        </div>
      </section>

      <section className="grid" aria-label="Principes">
        {pillars.map((pillar) => (
          <article key={pillar} className="card">
            <h2>{pillar}</h2>
            <p>
              Chaque donnée doit rester sourcée, versionnée et vérifiable avant
              d’être utilisée dans un calcul ou une interface publique.
            </p>
          </article>
        ))}
      </section>

      <section className="notice">
        <h2>Statut</h2>
        <p>
          Prototype initial. Le moteur d’import CIQUAL, le calcul nutrition-gap
          et l’API publique sont en cours de construction.
        </p>
      </section>
    </main>
  );
}
