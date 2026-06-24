const priorityCards = [
  { name: "Magnesium", value: "61%", hint: "energie, muscles, systeme nerveux" },
  { name: "Omega-3", value: "45%", hint: "coeur, cerveau, recuperation" },
  { name: "Vitamine D", value: "28%", hint: "immunite, os, humeur" },
  { name: "Fibres", value: "72%", hint: "satiété, transit, microbiote" }
];

const popular = ["Banane", "Saumon", "Avoine", "Oeuf", "Lentilles", "Yaourt nature"];

export default function HomePage() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top">NutriAtlas</a>
        <div className="navLinks">
          <a href="/search">Recherche</a>
          <a href="/profil">Profil</a>
          <a href="#priorites">Priorites</a>
        </div>
      </nav>

      <section id="top" className="hero pageSection premiumHero">
        <div className="heroCopy premiumCopy">
          <p className="eyebrow">Nutrition de precision · Aliments · Profil</p>
          <h1>Comprendre chaque aliment. Mieux nourrir votre corps.</h1>
          <p className="lead">
            NutriAtlas transforme les donnees nutritionnelles en recommandations lisibles : aliments,
            portions, priorites du jour et profil personnel.
          </p>
          <div className="ctaRow">
            <a className="primaryCta" href="/search">Rechercher un aliment</a>
            <a className="secondaryCta" href="/profil">Mon profil</a>
          </div>
          <div className="trustRow" aria-label="Points forts">
            <span>Donnees officielles</span>
            <span>Analyse par portion</span>
            <span>Priorites personnalisees</span>
          </div>
        </div>

        <aside className="dishShowcase" aria-label="Apercu NutriAtlas">
          <div className="dishPlate">
            <span className="foodEmoji">🥑</span>
            <span className="foodEmoji">🍅</span>
            <span className="foodEmoji">🥬</span>
            <span className="foodEmoji">🫘</span>
            <span className="foodEmoji">🍚</span>
          </div>
          <div className="scoreFloat">
            <span>Score nutritionnel</span>
            <strong>A</strong>
            <small>Excellent</small>
          </div>
        </aside>
      </section>

      <section className="pageSection searchDock" aria-label="Recherche rapide">
        <form className="searchBox" action="/search">
          <span>🔎</span>
          <input name="q" aria-label="Recherche aliment" placeholder="Rechercher un aliment : banane, saumon, lentilles..." />
          <button>Rechercher</button>
        </form>
        <div className="popularChips">
          <span>Suggestions populaires :</span>
          {popular.map((item) => (
            <a href={`/search?q=${encodeURIComponent(item)}`} key={item}>{item}</a>
          ))}
        </div>
      </section>

      <section id="priorites" className="pageSection dashboardGrid">
        <div className="dashboardIntro">
          <p className="eyebrow">Tableau de bord</p>
          <h2>Vos priorites nutritionnelles en un coup d oeil.</h2>
          <p>
            Une lecture simple pour savoir quoi renforcer dans l assiette, sans transformer la nutrition en tableur.
          </p>
        </div>
        <div className="priorityGrid">
          {priorityCards.map((card) => (
            <article className="priorityCard" key={card.name}>
              <div className="ring"><strong>{card.value}</strong></div>
              <h3>{card.name}</h3>
              <p>{card.hint}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pageSection premiumBand">
        <div>
          <p className="eyebrow">Experience</p>
          <h2>De la recherche alimentaire a la decision utile.</h2>
        </div>
        <div className="formula">
          <code>nom exact → suggestion intelligente</code>
          <code>aliment choisi → valeurs par portion</code>
          <code>profil → priorites personnalisees</code>
        </div>
      </section>
    </main>
  );
}
