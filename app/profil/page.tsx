const scenarios = [
  "Perte de poids progressive",
  "Maintien et énergie stable",
  "Performance et récupération",
  "Longévité et prévention"
];

function computeBmi(weightKg: number, heightCm: number) {
  return weightKg / Math.pow(heightCm / 100, 2);
}

function bmiLabel(bmi: number) {
  if (bmi < 18.5) return "Poids bas";
  if (bmi < 25) return "Zone de référence";
  if (bmi < 30) return "Surpoids";
  return "Obésité";
}

function mifflin(age: number, heightCm: number, weightKg: number, sex: "female" | "male") {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (sex === "male" ? 5 : -161));
}

export default function ProfilePage() {
  const age = 38;
  const height = 175;
  const weight = 72;
  const sex: "female" | "male" = "male";
  const bmi = computeBmi(weight, height);
  const bmr = mifflin(age, height, weight, sex);
  const calories = Math.round(bmr * 1.45);
  const longevityAge = Math.max(18, Math.round(age - 2));

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/search">Recherche</a>
          <a href="/profil">Profil</a>
          <a href="/#sources">Sources</a>
        </div>
      </nav>

      <section className="profileHero pageSection">
        <div className="profileIntro">
          <p className="eyebrow">Profil initial</p>
          <h1>Âge, taille, poids, besoins et axe longévité.</h1>
          <p>
            Cette page pose la base du profil NutriAtlas : IMC, dépense estimée, besoin énergétique,
            priorité nutritionnelle et score longévité indicatif.
          </p>
        </div>

        <aside className="profilePanel">
          <p className="eyebrow">Exemple calculé</p>
          <div className="metricGrid">
            <div><span>IMC</span><strong>{bmi.toFixed(1)}</strong><small>{bmiLabel(bmi)}</small></div>
            <div><span>Métabolisme</span><strong>{bmr}</strong><small>kcal / jour</small></div>
            <div><span>Besoin estimé</span><strong>{calories}</strong><small>kcal / jour</small></div>
            <div><span>Âge longévité</span><strong>{longevityAge}</strong><small>estimation prudente</small></div>
          </div>
        </aside>
      </section>

      <section className="pageSection profileFormPreview">
        <div>
          <p className="eyebrow">Entrées prévues</p>
          <h2>Le formulaire profil arrive ici.</h2>
          <p>
            Les entrées seront simples : âge, sexe, taille, poids, activité, objectif et contraintes.
            Les résultats resteront explicatifs, non médicaux, et reliés aux apports alimentaires.
          </p>
        </div>
        <div className="scenarioGrid">
          {scenarios.map((scenario) => (
            <article key={scenario}>
              <strong>{scenario}</strong>
              <span>Score, besoins et priorités alimentaires.</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
